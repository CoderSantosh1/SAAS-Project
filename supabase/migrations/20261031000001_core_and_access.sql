-- Core helpers, profiles and the admin access model.
--
-- Admin rights live only in admin_user_roles, which only a Super Admin can write.
-- Nothing on profiles can grant admin access.

create type public.account_status as enum ('active', 'suspended');

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text check (char_length(full_name) <= 120),
  avatar_url text,
  account_status public.account_status not null default 'active',
  suspended_at timestamptz,
  suspended_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_account_status_idx on public.profiles (account_status);
create index profiles_created_at_idx on public.profiles (created_at desc);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Admin roles and permissions
-- ---------------------------------------------------------------------------
create table public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  -- A super role holds every permission, including ones added later.
  is_super boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.admin_permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text
);

create table public.admin_role_permissions (
  role_id uuid not null references public.admin_roles (id) on delete cascade,
  permission_id uuid not null references public.admin_permissions (id) on delete cascade,
  primary key (role_id, permission_id)
);

create index admin_role_permissions_permission_idx
  on public.admin_role_permissions (permission_id);

create table public.admin_user_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role_id uuid not null references public.admin_roles (id) on delete restrict,
  granted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create index admin_user_roles_role_idx on public.admin_user_roles (role_id);

-- ---------------------------------------------------------------------------
-- Authorization helpers. These are security definer so policies can call them
-- without recursing through RLS on the tables they read.
-- ---------------------------------------------------------------------------
create function public.is_active_user()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and account_status = 'active'
  );
$$;

create function public.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_user_roles ur
    join public.profiles p on p.id = ur.user_id
    where ur.user_id = auth.uid() and p.account_status = 'active'
  );
$$;

create function public.is_super_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_user_roles ur
    join public.admin_roles r on r.id = ur.role_id
    join public.profiles p on p.id = ur.user_id
    where ur.user_id = auth.uid() and r.is_super and p.account_status = 'active'
  );
$$;

create function public.has_permission(permission_key text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select public.is_super_admin() or exists (
    select 1
    from public.admin_user_roles ur
    join public.profiles p on p.id = ur.user_id
    join public.admin_role_permissions rp on rp.role_id = ur.role_id
    join public.admin_permissions ap on ap.id = rp.permission_id
    where ur.user_id = auth.uid()
      and p.account_status = 'active'
      and ap.key = permission_key
  );
$$;

-- The caller's own admin access, used by the server to build the admin session.
create function public.my_admin_access()
returns table (role_slug text, is_super boolean, permission_key text)
language sql stable security definer
set search_path = ''
as $$
  select r.slug, r.is_super, ap.key
  from public.admin_user_roles ur
  join public.profiles p on p.id = ur.user_id
  join public.admin_roles r on r.id = ur.role_id
  left join public.admin_role_permissions rp on rp.role_id = r.id
  left join public.admin_permissions ap on ap.id = rp.permission_id
  where ur.user_id = auth.uid() and p.account_status = 'active';
$$;

-- ---------------------------------------------------------------------------
-- Profile triggers
-- ---------------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.handle_user_email_change()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- RLS is row level, so column rules for API callers are enforced here. Trusted
-- roles (migrations, the auth triggers, service role) are not restricted.
create function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if new.id <> old.id or new.email <> old.email or new.created_at <> old.created_at then
    raise exception 'These profile fields cannot be changed' using errcode = '42501';
  end if;

  if (new.account_status, new.suspended_at, new.suspended_reason)
      is distinct from (old.account_status, old.suspended_at, old.suspended_reason)
    and not public.has_permission('users.manage') then
    raise exception 'Not allowed to change account status' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger profiles_guard_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

-- The platform must always keep one Super Admin. Cascades from deleting the
-- account itself are refused too, so that an account is demoted first.
create function public.guard_last_super_admin()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.admin_roles where id = old.role_id and is_super)
    and not exists (
      select 1 from public.admin_user_roles ur
      join public.admin_roles r on r.id = ur.role_id
      where r.is_super and ur.user_id <> old.user_id
    ) then
    raise exception 'Cannot remove the last Super Admin' using errcode = '42501';
  end if;
  return old;
end;
$$;

create trigger admin_user_roles_guard_delete
  before delete on public.admin_user_roles
  for each row execute function public.guard_last_super_admin();

-- Bootstrap for the first Super Admin. Run from the SQL editor; API roles cannot
-- execute it.
create function public.grant_super_admin(target_email text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  target_id uuid;
begin
  select id into target_id from public.profiles where lower(email) = lower(target_email);
  if target_id is null then
    raise exception 'No registered user with email %', target_email;
  end if;

  insert into public.admin_user_roles (user_id, role_id)
  select target_id, id from public.admin_roles where slug = 'super_admin'
  on conflict do nothing;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.admin_roles enable row level security;
alter table public.admin_permissions enable row level security;
alter table public.admin_role_permissions enable row level security;
alter table public.admin_user_roles enable row level security;

create policy profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.has_permission('users.view'));

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or public.has_permission('users.manage'))
  with check (id = (select auth.uid()) or public.has_permission('users.manage'));

create policy admin_roles_select on public.admin_roles
  for select to authenticated using (public.is_admin());
create policy admin_roles_write on public.admin_roles
  for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

create policy admin_permissions_select on public.admin_permissions
  for select to authenticated using (public.is_admin());
create policy admin_permissions_write on public.admin_permissions
  for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

create policy admin_role_permissions_select on public.admin_role_permissions
  for select to authenticated using (public.is_admin());
create policy admin_role_permissions_write on public.admin_role_permissions
  for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

create policy admin_user_roles_select on public.admin_user_roles
  for select to authenticated
  using (user_id = (select auth.uid()) or public.has_permission('users.view'));
create policy admin_user_roles_write on public.admin_user_roles
  for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());
