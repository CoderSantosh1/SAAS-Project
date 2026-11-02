-- The admin panel's reads and writes. Every function checks an explicit permission,
-- and every write records its audit entry in the same transaction.

alter table public.support_tickets add column admin_response text check (char_length(admin_response) <= 5000);

create function public.require_permission(p_key text)
returns void
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not public.has_permission(p_key) then
    raise exception 'You do not have permission to do this' using errcode = '42501';
  end if;
end;
$$;

-- Lets these permissions store their own images without the general media permission.
create policy platform_media_section_assets on storage.objects
  for all to authenticated
  using (
    bucket_id = 'platform-media' and (
      ((storage.foldername(name))[1] = 'categories' and public.has_permission('categories.manage'))
      or ((storage.foldername(name))[1] = 'templates' and public.has_permission('templates.manage'))
      or ((storage.foldername(name))[1] = 'settings' and public.has_permission('settings.manage'))
    )
  )
  with check (
    bucket_id = 'platform-media' and (
      ((storage.foldername(name))[1] = 'categories' and public.has_permission('categories.manage'))
      or ((storage.foldername(name))[1] = 'templates' and public.has_permission('templates.manage'))
      or ((storage.foldername(name))[1] = 'settings' and public.has_permission('settings.manage'))
    )
  );

-- Custom templates now exist, so a theme's edit syncs only the listing named after it.
create or replace function public.update_theme(p_theme_id uuid, p_theme jsonb)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_old public.themes;
begin
  perform public.require_theme_admin();

  select * into v_old from public.themes where id = p_theme_id;
  if not found then
    raise exception 'Theme not found' using errcode = 'P0002';
  end if;

  update public.themes set
    name = p_theme ->> 'name',
    slug = p_theme ->> 'slug',
    description = p_theme ->> 'description',
    category_id = (p_theme ->> 'category_id')::uuid,
    is_premium = coalesce((p_theme ->> 'is_premium')::boolean, false),
    is_featured = coalesce((p_theme ->> 'is_featured')::boolean, false),
    author_name = p_theme ->> 'author_name',
    author_url = p_theme ->> 'author_url',
    supported_features = coalesce(p_theme -> 'supported_features', '[]'::jsonb),
    thumbnail_url = p_theme ->> 'thumbnail_url',
    desktop_preview_url = p_theme ->> 'desktop_preview_url',
    mobile_preview_url = p_theme ->> 'mobile_preview_url',
    preview_url = p_theme ->> 'preview_url'
  where id = p_theme_id;

  update public.templates set
    name = p_theme ->> 'name',
    description = p_theme ->> 'description',
    is_featured = coalesce((p_theme ->> 'is_featured')::boolean, false)
  where theme_id = p_theme_id and slug = v_old.slug;

  delete from public.template_categories tc
  using public.templates t
  where tc.template_id = t.id and t.theme_id = p_theme_id and t.slug = v_old.slug
    and tc.category_id = v_old.category_id;

  if p_theme ->> 'category_id' is not null then
    insert into public.template_categories (template_id, category_id)
    select t.id, (p_theme ->> 'category_id')::uuid
    from public.templates t where t.theme_id = p_theme_id and t.slug = v_old.slug
    on conflict do nothing;
  end if;

  perform public.log_activity('theme.update', 'theme', p_theme_id::text);
end;
$$;

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
create function public.admin_list_users(p_search text default null, p_status text default null, p_offset integer default 0)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  perform public.require_permission('users.view');

  with matched as (
    select p.*
    from public.profiles p
    where (coalesce(p_status, '') = '' or p.account_status::text = p_status)
      and (coalesce(p_search, '') = ''
        or strpos(lower(p.email || ' ' || coalesce(p.full_name, '') || ' ' || p.id::text), lower(p_search)) > 0)
  ),
  page as (
    select * from matched order by created_at desc, id limit 50 offset greatest(coalesce(p_offset, 0), 0)
  )
  select jsonb_build_object(
    'total', (select count(*) from matched),
    'rows', coalesce(jsonb_agg(jsonb_build_object(
      'id', page.id,
      'email', page.email,
      'full_name', page.full_name,
      'account_status', page.account_status,
      'created_at', page.created_at,
      'website_count', (select count(*) from public.websites w where w.owner_id = page.id),
      'published_count', (select count(*) from public.websites w where w.owner_id = page.id and w.status = 'published')
    ) order by page.created_at desc, page.id), '[]'::jsonb)
  ) into v_result
  from page;

  return v_result;
end;
$$;

create function public.admin_get_user(p_user_id uuid)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  perform public.require_permission('users.view');

  select jsonb_build_object(
    'id', p.id,
    'email', p.email,
    'full_name', p.full_name,
    'account_status', p.account_status,
    'suspended_at', p.suspended_at,
    'suspended_reason', p.suspended_reason,
    'created_at', p.created_at,
    'roles', coalesce((
      select jsonb_agg(r.slug order by r.slug)
      from public.admin_user_roles ur join public.admin_roles r on r.id = ur.role_id
      where ur.user_id = p.id
    ), '[]'::jsonb),
    'websites', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', w.id, 'name', w.name, 'slug', w.slug, 'status', w.status,
        'published_at', w.published_at, 'updated_at', w.updated_at
      ) order by w.updated_at desc)
      from public.websites w where w.owner_id = p.id
    ), '[]'::jsonb)
  ) into v_result
  from public.profiles p
  where p.id = p_user_id;

  return v_result;
end;
$$;

-- Suspending keeps all of the user's data.
create function public.admin_set_user_status(p_user_id uuid, p_status public.account_status, p_reason text default null)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  perform public.require_permission('users.manage');

  if p_status = 'suspended' then
    if p_user_id = auth.uid() then
      raise exception 'You cannot suspend your own account' using errcode = 'WA001';
    end if;
    if not public.is_super_admin() and exists (
      select 1 from public.admin_user_roles ur join public.admin_roles r on r.id = ur.role_id
      where ur.user_id = p_user_id and r.is_super
    ) then
      raise exception 'Only a Super Admin can suspend a Super Admin' using errcode = 'WA002';
    end if;
  end if;

  update public.profiles set
    account_status = p_status,
    suspended_at = case when p_status = 'suspended' then now() end,
    suspended_reason = case when p_status = 'suspended' then p_reason end
  where id = p_user_id;
  if not found then
    raise exception 'User not found' using errcode = 'P0002';
  end if;

  perform public.log_activity(
    case when p_status = 'suspended' then 'user.suspend' else 'user.restore' end,
    'user', p_user_id::text, jsonb_strip_nulls(jsonb_build_object('reason', p_reason)));
end;
$$;

create function public.admin_set_user_roles(p_user_id uuid, p_role_slugs text[])
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Only a Super Admin can assign roles' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'User not found' using errcode = 'P0002';
  end if;

  -- The last-Super-Admin guard refuses this if it would leave the platform without one.
  delete from public.admin_user_roles ur
  using public.admin_roles r
  where ur.role_id = r.id and ur.user_id = p_user_id and not (r.slug = any(p_role_slugs));

  insert into public.admin_user_roles (user_id, role_id, granted_by)
  select p_user_id, r.id, auth.uid()
  from public.admin_roles r
  where r.slug = any(p_role_slugs)
  on conflict do nothing;

  perform public.log_activity('user.roles_change', 'user', p_user_id::text, jsonb_build_object('roles', p_role_slugs));
end;
$$;

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
create function public.admin_list_categories()
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform public.require_permission('categories.manage');
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c.id, 'name', c.name, 'slug', c.slug, 'description', c.description, 'icon', c.icon,
      'thumbnail_url', c.thumbnail_url, 'status', c.status, 'is_featured', c.is_featured,
      'display_order', c.display_order,
      'theme_count', (select count(*) from public.themes th where th.category_id = c.id),
      'website_count', (select count(*) from public.websites w where w.category_id = c.id)
    ) order by c.display_order, c.name)
    from public.categories c
  ), '[]'::jsonb);
end;
$$;

create function public.admin_save_category(p_id uuid, p_data jsonb)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  perform public.require_permission('categories.manage');

  if p_id is null then
    insert into public.categories (name, slug, description, icon, thumbnail_url, status, is_featured, display_order)
    values (
      p_data ->> 'name', p_data ->> 'slug', p_data ->> 'description', p_data ->> 'icon', p_data ->> 'thumbnail_url',
      (p_data ->> 'status')::public.publish_status,
      coalesce((p_data ->> 'is_featured')::boolean, false),
      coalesce((p_data ->> 'display_order')::integer, 0)
    )
    returning id into v_id;
  else
    update public.categories set
      name = p_data ->> 'name',
      slug = p_data ->> 'slug',
      description = p_data ->> 'description',
      icon = p_data ->> 'icon',
      thumbnail_url = p_data ->> 'thumbnail_url',
      status = (p_data ->> 'status')::public.publish_status,
      is_featured = coalesce((p_data ->> 'is_featured')::boolean, false),
      display_order = coalesce((p_data ->> 'display_order')::integer, 0)
    where id = p_id
    returning id into v_id;
    if not found then
      raise exception 'Category not found' using errcode = 'P0002';
    end if;
  end if;

  perform public.log_activity(case when p_id is null then 'category.create' else 'category.update' end,
    'category', v_id::text, jsonb_build_object('slug', p_data ->> 'slug'));
  return v_id;
end;
$$;

create function public.admin_delete_category(p_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_slug text;
begin
  perform public.require_permission('categories.manage');

  if exists (select 1 from public.themes where category_id = p_id)
    or exists (select 1 from public.websites where category_id = p_id)
    or exists (select 1 from public.template_categories where category_id = p_id) then
    raise exception 'Themes, templates or websites use this category, so archive it instead' using errcode = 'WA003';
  end if;

  delete from public.categories where id = p_id returning slug into v_slug;
  if not found then
    raise exception 'Category not found' using errcode = 'P0002';
  end if;

  perform public.log_activity('category.delete', 'category', p_id::text, jsonb_build_object('slug', v_slug));
end;
$$;

-- ---------------------------------------------------------------------------
-- Templates
-- ---------------------------------------------------------------------------
create function public.admin_list_templates()
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform public.require_permission('templates.manage');
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', t.id, 'name', t.name, 'slug', t.slug, 'description', t.description, 'theme_id', t.theme_id,
      'theme_name', th.name, 'theme_status', th.status, 'preview_images', t.preview_images,
      'status', t.status, 'is_featured', t.is_featured, 'is_visible', t.is_visible,
      'display_order', t.display_order,
      'category_ids', coalesce((
        select jsonb_agg(tc.category_id) from public.template_categories tc where tc.template_id = t.id
      ), '[]'::jsonb),
      'website_count', (select count(*) from public.websites w where w.template_id = t.id)
    ) order by t.display_order, t.name)
    from public.templates t join public.themes th on th.id = t.theme_id
  ), '[]'::jsonb);
end;
$$;

create function public.admin_save_template(p_id uuid, p_data jsonb, p_category_ids uuid[])
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  perform public.require_permission('templates.manage');

  if p_id is null then
    insert into public.templates (theme_id, name, slug, description, preview_images, status, is_featured, is_visible, display_order)
    values (
      (p_data ->> 'theme_id')::uuid, p_data ->> 'name', p_data ->> 'slug', p_data ->> 'description',
      coalesce(p_data -> 'preview_images', '[]'::jsonb),
      (p_data ->> 'status')::public.publish_status,
      coalesce((p_data ->> 'is_featured')::boolean, false),
      coalesce((p_data ->> 'is_visible')::boolean, true),
      coalesce((p_data ->> 'display_order')::integer, 0)
    )
    returning id into v_id;
  else
    update public.templates set
      theme_id = (p_data ->> 'theme_id')::uuid,
      name = p_data ->> 'name',
      slug = p_data ->> 'slug',
      description = p_data ->> 'description',
      preview_images = coalesce(p_data -> 'preview_images', '[]'::jsonb),
      status = (p_data ->> 'status')::public.publish_status,
      is_featured = coalesce((p_data ->> 'is_featured')::boolean, false),
      is_visible = coalesce((p_data ->> 'is_visible')::boolean, true),
      display_order = coalesce((p_data ->> 'display_order')::integer, 0)
    where id = p_id
    returning id into v_id;
    if not found then
      raise exception 'Template not found' using errcode = 'P0002';
    end if;
  end if;

  delete from public.template_categories where template_id = v_id;
  insert into public.template_categories (template_id, category_id)
  select v_id, unnest(coalesce(p_category_ids, '{}'::uuid[]));

  perform public.log_activity(case when p_id is null then 'template.create' else 'template.update' end,
    'template', v_id::text, jsonb_build_object('slug', p_data ->> 'slug'));
  return v_id;
end;
$$;

-- Websites keep working after this: their template link is simply cleared.
create function public.admin_delete_template(p_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_slug text;
begin
  perform public.require_permission('templates.manage');
  delete from public.templates where id = p_id returning slug into v_slug;
  if not found then
    raise exception 'Template not found' using errcode = 'P0002';
  end if;
  perform public.log_activity('template.delete', 'template', p_id::text, jsonb_build_object('slug', v_slug));
end;
$$;

-- ---------------------------------------------------------------------------
-- Websites
-- ---------------------------------------------------------------------------
create function public.admin_list_websites(
  p_search text default null,
  p_status text default null,
  p_category_id uuid default null,
  p_owner_id uuid default null,
  p_published_only boolean default false,
  p_offset integer default 0
)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  perform public.require_permission('websites.view');

  with matched as (
    select w.*, p.email as owner_email, c.name as category_name, th.name as theme_name
    from public.websites w
    join public.profiles p on p.id = w.owner_id
    left join public.categories c on c.id = w.category_id
    left join public.themes th on th.id = w.theme_id
    where (coalesce(p_status, '') = '' or w.status::text = p_status)
      and (p_category_id is null or w.category_id = p_category_id)
      and (p_owner_id is null or w.owner_id = p_owner_id)
      and (not p_published_only or w.published_version_id is not null)
      and (coalesce(p_search, '') = ''
        or strpos(lower(w.name || ' ' || w.slug || ' ' || p.email), lower(p_search)) > 0)
  ),
  page as (
    select * from matched order by updated_at desc, id limit 50 offset greatest(coalesce(p_offset, 0), 0)
  )
  select jsonb_build_object(
    'total', (select count(*) from matched),
    'rows', coalesce(jsonb_agg(jsonb_build_object(
      'id', page.id, 'name', page.name, 'slug', page.slug, 'status', page.status,
      'owner_id', page.owner_id, 'owner_email', page.owner_email, 'category_name', page.category_name,
      'theme_name', page.theme_name, 'created_at', page.created_at, 'updated_at', page.updated_at,
      'published_at', page.published_at
    ) order by page.updated_at desc, page.id), '[]'::jsonb)
  ) into v_result
  from page;

  return v_result;
end;
$$;

create function public.admin_get_website(p_id uuid)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  perform public.require_permission('websites.view');
  select jsonb_build_object(
    'id', w.id, 'name', w.name, 'slug', w.slug, 'status', w.status, 'description', w.description,
    'business_name', w.business_name, 'suspended_reason', w.suspended_reason,
    'created_at', w.created_at, 'updated_at', w.updated_at, 'published_at', w.published_at,
    'owner_id', w.owner_id, 'owner_email', p.email, 'owner_name', p.full_name,
    'category_name', c.name, 'theme_name', th.name,
    'page_count', (select count(*) from public.website_pages pg where pg.website_id = w.id)
  ) into v_result
  from public.websites w
  join public.profiles p on p.id = w.owner_id
  left join public.categories c on c.id = w.category_id
  left join public.themes th on th.id = w.theme_id
  where w.id = p_id;
  return v_result;
end;
$$;

-- Restoring returns the website to what it was: published if it has a live version.
create function public.admin_set_website_suspended(p_id uuid, p_suspended boolean, p_reason text default null)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  perform public.require_permission('websites.moderate');

  update public.websites set
    status = case
      when p_suspended then 'suspended'::public.website_status
      when published_version_id is not null then 'published'::public.website_status
      else 'draft'::public.website_status
    end,
    suspended_reason = case when p_suspended then p_reason end
  where id = p_id;
  if not found then
    raise exception 'Website not found' using errcode = 'P0002';
  end if;

  perform public.log_activity(case when p_suspended then 'website.suspend' else 'website.restore' end,
    'website', p_id::text, jsonb_strip_nulls(jsonb_build_object('reason', p_reason)));
end;
$$;

-- ---------------------------------------------------------------------------
-- Platform media
-- ---------------------------------------------------------------------------
create function public.admin_list_media(p_search text default null)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform public.require_permission('media.manage');
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', m.id, 'path', m.path, 'file_name', m.file_name, 'mime_type', m.mime_type,
      'size_bytes', m.size_bytes, 'width', m.width, 'height', m.height, 'created_at', m.created_at
    ) order by m.created_at desc)
    from (
      select * from public.media_assets
      where scope = 'platform'
        and (coalesce(p_search, '') = '' or strpos(lower(file_name), lower(p_search)) > 0)
      order by created_at desc limit 200
    ) m
  ), '[]'::jsonb);
end;
$$;

create function public.admin_add_media(p_data jsonb)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  perform public.require_permission('media.manage');
  insert into public.media_assets (scope, bucket, path, file_name, mime_type, size_bytes, width, height)
  values (
    'platform', 'platform-media', p_data ->> 'path', p_data ->> 'file_name', p_data ->> 'mime_type',
    (p_data ->> 'size_bytes')::bigint, (p_data ->> 'width')::integer, (p_data ->> 'height')::integer
  )
  returning id into v_id;
  perform public.log_activity('media.upload', 'media', v_id::text, jsonb_build_object('file', p_data ->> 'file_name'));
end;
$$;

-- Returns the storage path, so the caller can remove the file too. Only platform media
-- can be reached here, so user files stay out of admin hands.
create function public.admin_delete_media(p_id uuid)
returns text
language plpgsql security definer
set search_path = ''
as $$
declare
  v_path text;
begin
  perform public.require_permission('media.manage');
  delete from public.media_assets where id = p_id and scope = 'platform' returning path into v_path;
  if not found then
    raise exception 'File not found' using errcode = 'P0002';
  end if;
  perform public.log_activity('media.delete', 'media', p_id::text, jsonb_build_object('path', v_path));
  return v_path;
end;
$$;

-- ---------------------------------------------------------------------------
-- Domains
-- ---------------------------------------------------------------------------
create function public.admin_list_domains(p_search text default null, p_offset integer default 0)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_custom jsonb;
  v_subdomains jsonb;
begin
  perform public.require_permission('domains.manage');

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', d.id, 'hostname', d.hostname, 'status', d.status, 'ssl_status', d.ssl_status,
    'verification_token', d.verification_token, 'verified_at', d.verified_at, 'created_at', d.created_at,
    'website_id', w.id, 'website_name', w.name, 'owner_email', p.email
  ) order by d.created_at desc), '[]'::jsonb)
  into v_custom
  from public.website_domains d
  join public.websites w on w.id = d.website_id
  join public.profiles p on p.id = w.owner_id
  where coalesce(p_search, '') = '' or strpos(lower(d.hostname), lower(p_search)) > 0;

  with matched as (
    select w.id, w.name, w.slug, w.status, p.email
    from public.websites w join public.profiles p on p.id = w.owner_id
    where coalesce(p_search, '') = '' or strpos(lower(w.slug), lower(p_search)) > 0
  ),
  page as (select * from matched order by slug limit 50 offset greatest(coalesce(p_offset, 0), 0))
  select jsonb_build_object(
    'total', (select count(*) from matched),
    'rows', coalesce(jsonb_agg(jsonb_build_object(
      'id', page.id, 'name', page.name, 'slug', page.slug, 'status', page.status, 'owner_email', page.email
    ) order by page.slug), '[]'::jsonb)
  ) into v_subdomains
  from page;

  return jsonb_build_object('custom', v_custom, 'subdomains', v_subdomains);
end;
$$;

create function public.admin_set_domain_status(p_id uuid, p_status public.domain_status)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  perform public.require_permission('domains.manage');
  update public.website_domains set
    status = p_status,
    verified_at = case when p_status = 'verified' then now() else verified_at end
  where id = p_id;
  if not found then
    raise exception 'Domain not found' using errcode = 'P0002';
  end if;
  perform public.log_activity('domain.status_change', 'domain', p_id::text, jsonb_build_object('status', p_status));
end;
$$;

-- ---------------------------------------------------------------------------
-- Analytics. Only what the database truly knows, so visitor traffic is not here.
-- ---------------------------------------------------------------------------
create function public.admin_analytics(p_days integer default 30)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_days integer := least(greatest(coalesce(p_days, 30), 7), 365);
  v_since date := current_date - (v_days - 1);
begin
  perform public.require_permission('analytics.view');
  return jsonb_build_object(
    'days', v_days,
    'totals', jsonb_build_object(
      'users', (select count(*) from public.profiles),
      'active_users', (select count(*) from public.profiles where account_status = 'active'),
      'suspended_users', (select count(*) from public.profiles where account_status = 'suspended'),
      'users_with_website', (select count(distinct owner_id) from public.websites),
      'websites', (select count(*) from public.websites),
      'published', (select count(*) from public.websites where status = 'published'),
      'drafts', (select count(*) from public.websites where status = 'draft'),
      'storage_bytes', (select coalesce(sum(size_bytes), 0) from public.media_assets)
    ),
    'series', (
      select jsonb_agg(jsonb_build_object(
        'date', d::date,
        'users', (select count(*) from public.profiles p where p.created_at::date = d::date),
        'websites', (select count(*) from public.websites w where w.created_at::date = d::date),
        'published', (select count(*) from public.websites w where w.published_at::date = d::date)
      ) order by d)
      from generate_series(v_since::timestamp, current_date::timestamp, interval '1 day') d
    ),
    'popular_themes', coalesce((
      select jsonb_agg(row_to_json(x)) from (
        select th.name, count(w.id) as count
        from public.themes th join public.websites w on w.theme_id = th.id
        group by th.name order by count(w.id) desc, th.name limit 8
      ) x
    ), '[]'::jsonb),
    'popular_categories', coalesce((
      select jsonb_agg(row_to_json(x)) from (
        select c.name, count(w.id) as count
        from public.categories c join public.websites w on w.category_id = c.id
        group by c.name order by count(w.id) desc, c.name limit 8
      ) x
    ), '[]'::jsonb)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Plans
-- ---------------------------------------------------------------------------
create function public.admin_list_plans()
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform public.require_permission('plans.manage');
  return coalesce((
    select jsonb_agg(to_jsonb(p) order by p.display_order, p.name) from public.plans p
  ), '[]'::jsonb);
end;
$$;

create function public.admin_save_plan(p_id uuid, p_data jsonb)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  perform public.require_permission('plans.manage');

  if p_id is null then
    insert into public.plans (slug, name, display_order) values (p_data ->> 'slug', p_data ->> 'name', 100)
    returning id into v_id;
  else
    v_id := p_id;
  end if;

  update public.plans set
    name = p_data ->> 'name',
    slug = p_data ->> 'slug',
    monthly_price_paise = (p_data ->> 'monthly_price_paise')::integer,
    website_limit = (p_data ->> 'website_limit')::integer,
    storage_limit_mb = (p_data ->> 'storage_limit_mb')::integer,
    custom_domains = coalesce((p_data ->> 'custom_domains')::boolean, false),
    premium_themes = coalesce((p_data ->> 'premium_themes')::boolean, false),
    features = coalesce(p_data -> 'features', '[]'::jsonb),
    is_active = coalesce((p_data ->> 'is_active')::boolean, false)
  where id = v_id;
  if not found then
    raise exception 'Plan not found' using errcode = 'P0002';
  end if;

  perform public.log_activity(case when p_id is null then 'plan.create' else 'plan.update' end,
    'plan', v_id::text, jsonb_build_object('slug', p_data ->> 'slug', 'active', p_data ->> 'is_active'));
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Support
-- ---------------------------------------------------------------------------
create function public.admin_list_tickets(p_status text default null, p_search text default null, p_offset integer default 0)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  perform public.require_permission('support.manage');

  with matched as (
    select t.*, p.email as user_email, w.name as website_name, a.email as assignee_email
    from public.support_tickets t
    join public.profiles p on p.id = t.user_id
    left join public.websites w on w.id = t.website_id
    left join public.profiles a on a.id = t.assigned_to
    where (coalesce(p_status, '') = '' or t.status::text = p_status)
      and (coalesce(p_search, '') = '' or strpos(lower(t.subject || ' ' || p.email), lower(p_search)) > 0)
  ),
  page as (select * from matched order by created_at desc, id limit 50 offset greatest(coalesce(p_offset, 0), 0))
  select jsonb_build_object(
    'total', (select count(*) from matched),
    'rows', coalesce(jsonb_agg(jsonb_build_object(
      'id', page.id, 'subject', page.subject, 'message', page.message, 'status', page.status,
      'priority', page.priority, 'admin_response', page.admin_response, 'created_at', page.created_at,
      'user_id', page.user_id, 'user_email', page.user_email, 'website_name', page.website_name,
      'assignee_email', page.assignee_email
    ) order by page.created_at desc, page.id), '[]'::jsonb)
  ) into v_result
  from page;
  return v_result;
end;
$$;

create function public.admin_update_ticket(
  p_id uuid,
  p_status public.ticket_status,
  p_priority public.ticket_priority,
  p_response text
)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  perform public.require_permission('support.manage');
  update public.support_tickets set
    status = p_status,
    priority = p_priority,
    admin_response = p_response,
    assigned_to = auth.uid()
  where id = p_id;
  if not found then
    raise exception 'Ticket not found' using errcode = 'P0002';
  end if;
  perform public.log_activity('ticket.update', 'ticket', p_id::text, jsonb_build_object('status', p_status));
end;
$$;

-- ---------------------------------------------------------------------------
-- Activity log
-- ---------------------------------------------------------------------------
create function public.admin_list_activity(p_search text default null, p_offset integer default 0, p_limit integer default 50)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  perform public.require_permission('activity_logs.view');

  with matched as (
    select * from public.activity_logs
    where coalesce(p_search, '') = ''
      or strpos(lower(action || ' ' || coalesce(actor_email, '') || ' ' || coalesce(target_id, '')), lower(p_search)) > 0
  ),
  page as (
    select * from matched order by created_at desc, id
    limit least(greatest(coalesce(p_limit, 50), 1), 100) offset greatest(coalesce(p_offset, 0), 0)
  )
  select jsonb_build_object(
    'total', (select count(*) from matched),
    'rows', coalesce(jsonb_agg(jsonb_build_object(
      'id', page.id, 'actor_email', page.actor_email, 'action', page.action, 'target_type', page.target_type,
      'target_id', page.target_id, 'metadata', page.metadata, 'created_at', page.created_at
    ) order by page.created_at desc, page.id), '[]'::jsonb)
  ) into v_result
  from page;
  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Platform settings. Only keys the product really uses can be written.
-- ---------------------------------------------------------------------------
create function public.admin_save_settings(p_settings jsonb)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_key text;
  v_value jsonb;
begin
  perform public.require_permission('settings.manage');

  for v_key, v_value in select key, value from jsonb_each(p_settings) loop
    if v_key not in (
      'platform.name', 'platform.logo_url', 'platform.favicon_url', 'seo.title', 'seo.description',
      'contact.email', 'contact.phone', 'social.facebook', 'social.instagram', 'social.x', 'social.linkedin',
      'feature.registrations_open', 'platform.maintenance_mode'
    ) then
      raise exception 'Unknown setting %', v_key using errcode = '22023';
    end if;

    insert into public.platform_settings (key, value, is_public, updated_by)
    values (v_key, v_value, true, auth.uid())
    on conflict (key) do update set value = excluded.value, updated_by = excluded.updated_by;
  end loop;

  perform public.log_activity('settings.update', 'settings', null, jsonb_build_object('keys', (
    select jsonb_agg(key) from jsonb_object_keys(p_settings) key
  )));
end;
$$;

revoke all on function
  public.require_permission(text),
  public.admin_list_users(text, text, integer),
  public.admin_get_user(uuid),
  public.admin_set_user_status(uuid, public.account_status, text),
  public.admin_set_user_roles(uuid, text[]),
  public.admin_list_categories(),
  public.admin_save_category(uuid, jsonb),
  public.admin_delete_category(uuid),
  public.admin_list_templates(),
  public.admin_save_template(uuid, jsonb, uuid[]),
  public.admin_delete_template(uuid),
  public.admin_list_websites(text, text, uuid, uuid, boolean, integer),
  public.admin_get_website(uuid),
  public.admin_set_website_suspended(uuid, boolean, text),
  public.admin_list_media(text),
  public.admin_add_media(jsonb),
  public.admin_delete_media(uuid),
  public.admin_list_domains(text, integer),
  public.admin_set_domain_status(uuid, public.domain_status),
  public.admin_analytics(integer),
  public.admin_list_plans(),
  public.admin_save_plan(uuid, jsonb),
  public.admin_list_tickets(text, text, integer),
  public.admin_update_ticket(uuid, public.ticket_status, public.ticket_priority, text),
  public.admin_list_activity(text, integer, integer),
  public.admin_save_settings(jsonb)
from public, anon;

grant execute on function
  public.require_permission(text),
  public.admin_list_users(text, text, integer),
  public.admin_get_user(uuid),
  public.admin_set_user_status(uuid, public.account_status, text),
  public.admin_set_user_roles(uuid, text[]),
  public.admin_list_categories(),
  public.admin_save_category(uuid, jsonb),
  public.admin_delete_category(uuid),
  public.admin_list_templates(),
  public.admin_save_template(uuid, jsonb, uuid[]),
  public.admin_delete_template(uuid),
  public.admin_list_websites(text, text, uuid, uuid, boolean, integer),
  public.admin_get_website(uuid),
  public.admin_set_website_suspended(uuid, boolean, text),
  public.admin_list_media(text),
  public.admin_add_media(jsonb),
  public.admin_delete_media(uuid),
  public.admin_list_domains(text, integer),
  public.admin_set_domain_status(uuid, public.domain_status),
  public.admin_analytics(integer),
  public.admin_list_plans(),
  public.admin_save_plan(uuid, jsonb),
  public.admin_list_tickets(text, text, integer),
  public.admin_update_ticket(uuid, public.ticket_status, public.ticket_priority, text),
  public.admin_list_activity(text, integer, integer),
  public.admin_save_settings(jsonb)
to authenticated;
