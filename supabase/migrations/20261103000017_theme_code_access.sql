-- Theme source code downloads. Admins with the new permission can download any theme's
-- code and give a customer access to one theme. Every download and every change to
-- access is recorded in the activity log.

insert into public.admin_permissions (key, description) values
  ('themes.download_code', 'Download theme source code and give customers access to it');

insert into public.admin_role_permissions (role_id, permission_id)
select r.id, p.id
from public.admin_roles r
join public.admin_permissions p on p.key = 'themes.download_code'
where r.slug = 'platform_admin';

create table public.theme_code_grants (
  id uuid primary key default gen_random_uuid(),
  theme_id uuid not null references public.themes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  granted_by uuid references public.profiles (id) on delete set null,
  note text check (char_length(note) <= 300),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (theme_id, user_id)
);

create index theme_code_grants_user_idx on public.theme_code_grants (user_id);

-- Read through the functions below; nothing writes to the table directly.
alter table public.theme_code_grants enable row level security;

create policy theme_code_grants_select on public.theme_code_grants
  for select to authenticated
  using (user_id = auth.uid() or public.has_permission('themes.download_code'));

-- Whether the caller may download this theme's code right now.
create function public.can_download_theme_code(p_theme_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select public.has_permission('themes.download_code') or exists (
    select 1
    from public.theme_code_grants g
    join public.profiles p on p.id = g.user_id
    where g.theme_id = p_theme_id
      and g.user_id = auth.uid()
      and p.account_status = 'active'
      and (g.expires_at is null or g.expires_at > now())
  );
$$;

create function public.admin_list_theme_code_grants(p_theme_id uuid)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform public.require_permission('themes.download_code');
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', g.id,
      'email', p.email,
      'full_name', p.full_name,
      'note', g.note,
      'expires_at', g.expires_at,
      'created_at', g.created_at,
      'granted_by_email', gb.email
    ) order by g.created_at desc)
    from public.theme_code_grants g
    join public.profiles p on p.id = g.user_id
    left join public.profiles gb on gb.id = g.granted_by
    where g.theme_id = p_theme_id
  ), '[]'::jsonb);
end;
$$;

-- Gives (or renews) one customer's access, found by the email they signed up with.
create function public.admin_grant_theme_code(p_theme_id uuid, p_email text, p_note text default null, p_expires_at timestamptz default null)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_grant_id uuid;
begin
  perform public.require_permission('themes.download_code');

  if not exists (select 1 from public.themes where id = p_theme_id) then
    raise exception 'Theme not found' using errcode = 'P0002';
  end if;
  if p_expires_at is not null and p_expires_at <= now() then
    raise exception 'Choose an end date in the future' using errcode = 'WA010';
  end if;

  select id into v_user_id from public.profiles where lower(email) = lower(trim(p_email));
  if v_user_id is null then
    raise exception 'No account uses this email. Ask the customer to sign up first.' using errcode = 'P0002';
  end if;

  insert into public.theme_code_grants (theme_id, user_id, granted_by, note, expires_at)
  values (p_theme_id, v_user_id, auth.uid(), nullif(trim(p_note), ''), p_expires_at)
  on conflict (theme_id, user_id) do update set
    granted_by = excluded.granted_by,
    note = excluded.note,
    expires_at = excluded.expires_at,
    created_at = now()
  returning id into v_grant_id;

  perform public.log_activity('theme.code_grant', 'theme', p_theme_id::text,
    jsonb_strip_nulls(jsonb_build_object('user_id', v_user_id, 'email', lower(trim(p_email)), 'expires_at', p_expires_at)));
  return v_grant_id;
end;
$$;

create function public.admin_revoke_theme_code(p_grant_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_grant public.theme_code_grants;
begin
  perform public.require_permission('themes.download_code');

  delete from public.theme_code_grants where id = p_grant_id returning * into v_grant;
  if v_grant.id is null then
    raise exception 'Access not found' using errcode = 'P0002';
  end if;

  perform public.log_activity('theme.code_revoke', 'theme', v_grant.theme_id::text, jsonb_build_object('user_id', v_grant.user_id));
end;
$$;

-- The caller's own active access, for their dashboard.
create function public.list_my_theme_code()
returns table (theme_id uuid, name text, slug text, thumbnail_url text, expires_at timestamptz, granted_at timestamptz)
language sql stable security definer
set search_path = ''
as $$
  select t.id, t.name, t.slug, t.thumbnail_url, g.expires_at, g.created_at
  from public.theme_code_grants g
  join public.themes t on t.id = g.theme_id
  where g.user_id = auth.uid()
    and (g.expires_at is null or g.expires_at > now())
  order by g.created_at desc;
$$;

-- Checks access, records the download, and returns what the package is built from: the
-- approved component and the active version's tokens and starter content.
create function public.begin_theme_code_download(p_theme_id uuid)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if auth.uid() is null or not public.can_download_theme_code(p_theme_id) then
    raise exception 'You do not have access to this theme''s code' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'theme_id', t.id,
    'name', t.name,
    'slug', t.slug,
    'version', v.version,
    'component_id', v.component_id,
    'component_version', v.component_version,
    'design_tokens', v.design_tokens,
    'default_config', v.default_config
  ) into v_result
  from public.themes t
  join public.theme_versions v on v.id = t.current_version_id
  where t.id = p_theme_id;

  if v_result is null then
    raise exception 'This theme has no active version' using errcode = 'P0002';
  end if;

  -- Written directly, as customers are not admins and cannot call log_activity.
  insert into public.activity_logs (actor_id, actor_email, action, target_type, target_id, metadata)
  select auth.uid(), p.email, 'theme.code_download', 'theme', p_theme_id::text,
    jsonb_build_object('version', v_result ->> 'version', 'as_admin', public.has_permission('themes.download_code'))
  from public.profiles p
  where p.id = auth.uid();

  return v_result;
end;
$$;

revoke all on function
  public.can_download_theme_code(uuid),
  public.admin_list_theme_code_grants(uuid),
  public.admin_grant_theme_code(uuid, text, text, timestamptz),
  public.admin_revoke_theme_code(uuid),
  public.list_my_theme_code(),
  public.begin_theme_code_download(uuid)
from public, anon;

grant execute on function
  public.can_download_theme_code(uuid),
  public.admin_list_theme_code_grants(uuid),
  public.admin_grant_theme_code(uuid, text, text, timestamptz),
  public.admin_revoke_theme_code(uuid),
  public.list_my_theme_code(),
  public.begin_theme_code_download(uuid)
to authenticated;

revoke all on public.theme_code_grants from anon;
revoke insert, update, delete on public.theme_code_grants from authenticated;
grant select on public.theme_code_grants to authenticated;
