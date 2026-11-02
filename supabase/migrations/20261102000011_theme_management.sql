-- Admin theme management. An uploaded theme is data only: its own design tokens and
-- starter content, rendered by an approved component from the code-level registry.
-- component_version records exactly which registered component a version uses.

alter table public.theme_versions add column component_version text;
update public.theme_versions set component_version = version;
alter table public.theme_versions alter column component_version set not null;

-- Lets the themes.manage permission store theme images without media.manage.
create policy platform_media_theme_assets on storage.objects
  for all to authenticated
  using (
    bucket_id = 'platform-media'
    and (storage.foldername(name))[1] = 'themes'
    and public.has_permission('themes.manage')
  )
  with check (
    bucket_id = 'platform-media'
    and (storage.foldername(name))[1] = 'themes'
    and public.has_permission('themes.manage')
  );

-- Drafts and the editor now read a version's own tokens and registered component.
create or replace function public.get_website_draft(p_website_id uuid)
returns jsonb
language sql stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', w.id,
    'name', w.name,
    'business_name', w.business_name,
    'component_id', v.component_id,
    'version', v.component_version,
    'design_tokens', v.design_tokens,
    'design', coalesce(s.design, '{}'::jsonb),
    'pages', coalesce((
      select jsonb_agg(jsonb_build_object(
        'title', p.title,
        'slug', p.slug,
        'isHome', p.is_home,
        'isVisible', p.is_visible,
        'sections', coalesce((
          select jsonb_agg(jsonb_build_object(
            'type', sec.section_type,
            'props', sec.props,
            'design', sec.design,
            'isVisible', sec.is_visible
          ) order by sec.display_order, sec.created_at)
          from public.website_sections sec
          where sec.page_id = p.id
        ), '[]'::jsonb)
      ) order by p.display_order, p.created_at)
      from public.website_pages p
      where p.website_id = w.id
    ), '[]'::jsonb)
  )
  from public.websites w
  left join public.theme_versions v on v.id = w.theme_version_id
  left join public.website_settings s on s.website_id = w.id
  where w.id = p_website_id;
$$;

create or replace function public.get_website_editor(p_website_id uuid)
returns jsonb
language sql stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', w.id,
    'slug', w.slug,
    'status', w.status,
    'revision', w.draft_revision,
    'component_id', v.component_id,
    'version', v.component_version,
    'design_tokens', v.design_tokens,
    'document', jsonb_build_object(
      'name', w.name,
      'businessName', w.business_name,
      'design', coalesce(s.design, '{}'::jsonb),
      'pages', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', p.id,
          'title', p.title,
          'slug', p.slug,
          'isHome', p.is_home,
          'isVisible', p.is_visible,
          'seo', p.seo,
          'sections', coalesce((
            select jsonb_agg(jsonb_build_object(
              'id', sec.id,
              'type', sec.section_type,
              'props', sec.props,
              'design', sec.design,
              'isVisible', sec.is_visible
            ) order by sec.display_order, sec.created_at)
            from public.website_sections sec
            where sec.page_id = p.id
          ), '[]'::jsonb)
        ) order by p.display_order, p.created_at)
        from public.website_pages p
        where p.website_id = w.id
      ), '[]'::jsonb)
    )
  )
  from public.websites w
  left join public.theme_versions v on v.id = w.theme_version_id
  left join public.website_settings s on s.website_id = w.id
  where w.id = p_website_id and w.owner_id = auth.uid();
$$;

create or replace function public.get_marketplace_theme(p_theme_slug text)
returns jsonb
language sql stable
set search_path = ''
as $$
  select jsonb_build_object(
    'name', th.name,
    'slug', th.slug,
    'description', th.description,
    'is_premium', th.is_premium,
    'author_name', th.author_name,
    'supported_features', th.supported_features,
    'thumbnail_url', th.thumbnail_url,
    'version', v.version,
    'primary_color', v.design_tokens ->> 'primary',
    'categories', coalesce((
      select jsonb_agg(distinct jsonb_build_object('name', c.name, 'slug', c.slug))
      from public.templates t
      join public.template_categories tc on tc.template_id = t.id
      join public.categories c on c.id = tc.category_id
      where t.theme_id = th.id
        and t.status = 'published' and t.is_visible and c.status = 'published'
    ), '[]'::jsonb)
  )
  from public.themes th
  left join public.theme_versions v on v.id = th.current_version_id
  where th.slug = p_theme_slug and th.status = 'published';
$$;

-- Starter content of a published theme, for the public preview.
create function public.get_theme_preview(p_theme_slug text)
returns jsonb
language sql stable
set search_path = ''
as $$
  select jsonb_build_object(
    'name', th.name,
    'component_id', v.component_id,
    'version', v.component_version,
    'design_tokens', v.design_tokens,
    'pages', v.default_config -> 'pages'
  )
  from public.themes th
  join public.theme_versions v on v.id = th.current_version_id
  where th.slug = p_theme_slug and th.status = 'published';
$$;

-- Everything below is for admins. These are definer functions because a theme action
-- spans tables guarded by different permissions. Each one checks themes.manage first
-- and writes its own audit record, so an action cannot happen without being logged.
create function public.require_theme_admin()
returns void
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not public.has_permission('themes.manage') then
    raise exception 'You do not have permission to manage themes' using errcode = '42501';
  end if;
end;
$$;

create function public.list_admin_themes()
returns table (
  id uuid,
  name text,
  slug text,
  status public.theme_status,
  is_premium boolean,
  is_featured boolean,
  thumbnail_url text,
  updated_at timestamptz,
  category_name text,
  current_version text
)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform public.require_theme_admin();
  return query
    select th.id, th.name, th.slug, th.status, th.is_premium, th.is_featured,
      th.thumbnail_url, th.updated_at, c.name, v.version
    from public.themes th
    left join public.categories c on c.id = th.category_id
    left join public.theme_versions v on v.id = th.current_version_id
    order by th.updated_at desc;
end;
$$;

create function public.get_admin_theme(p_theme_id uuid)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_theme jsonb;
begin
  perform public.require_theme_admin();
  select jsonb_build_object(
    'id', th.id,
    'name', th.name,
    'slug', th.slug,
    'description', th.description,
    'category_id', th.category_id,
    'status', th.status,
    'is_premium', th.is_premium,
    'is_featured', th.is_featured,
    'author_name', th.author_name,
    'author_url', th.author_url,
    'supported_features', th.supported_features,
    'thumbnail_url', th.thumbnail_url,
    'desktop_preview_url', th.desktop_preview_url,
    'mobile_preview_url', th.mobile_preview_url,
    'preview_url', th.preview_url,
    'current_version_id', th.current_version_id,
    'website_count', (select count(*) from public.websites w where w.theme_id = th.id),
    'versions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', v.id,
        'version', v.version,
        'component_id', v.component_id,
        'component_version', v.component_version,
        'status', v.status,
        'changelog', v.changelog,
        'created_at', v.created_at,
        'website_count', (select count(*) from public.websites w where w.theme_version_id = v.id)
      ) order by v.created_at desc)
      from public.theme_versions v where v.theme_id = th.id
    ), '[]'::jsonb)
  )
  into v_theme
  from public.themes th
  where th.id = p_theme_id;
  return v_theme;
end;
$$;

-- For reviewing any version, including ones visitors cannot see.
create function public.get_admin_theme_version(p_version_id uuid)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  perform public.require_theme_admin();
  select jsonb_build_object(
    'name', th.name,
    'component_id', v.component_id,
    'version', v.component_version,
    'design_tokens', v.design_tokens,
    'pages', v.default_config -> 'pages'
  )
  into v_result
  from public.theme_versions v
  join public.themes th on th.id = v.theme_id
  where v.id = p_version_id;
  return v_result;
end;
$$;

create function public.insert_theme_version(p_theme_id uuid, p_version jsonb)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_version uuid;
begin
  perform public.require_theme_admin();

  insert into public.theme_versions (
    theme_id, version, component_id, component_version, status,
    package_path, default_config, design_tokens, compatibility, changelog
  )
  values (
    p_theme_id,
    p_version ->> 'version',
    p_version ->> 'component_id',
    p_version ->> 'component_version',
    'draft',
    p_version ->> 'package_path',
    p_version -> 'default_config',
    p_version -> 'design_tokens',
    coalesce(p_version -> 'compatibility', '{}'::jsonb),
    p_version ->> 'changelog'
  )
  returning id into v_version;

  insert into public.theme_sections (theme_version_id, section_type, label, default_props, props_schema, display_order)
  select v_version, s ->> 'type', s ->> 'label', s -> 'default_props', s -> 'props_schema', ordinality * 10
  from jsonb_array_elements(p_version -> 'sections') with ordinality as t(s, ordinality);

  return v_version;
end;
$$;

-- A new theme waits in review. It reaches visitors only through publish.
create function public.register_theme(p_theme jsonb, p_version jsonb)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_theme uuid;
  v_version uuid;
begin
  perform public.require_theme_admin();

  insert into public.themes (
    name, slug, description, category_id, status, is_premium, is_featured,
    author_name, author_url, supported_features, thumbnail_url,
    desktop_preview_url, mobile_preview_url, preview_url, created_by
  )
  values (
    p_theme ->> 'name',
    p_theme ->> 'slug',
    p_theme ->> 'description',
    (p_theme ->> 'category_id')::uuid,
    'under_review',
    coalesce((p_theme ->> 'is_premium')::boolean, false),
    coalesce((p_theme ->> 'is_featured')::boolean, false),
    p_theme ->> 'author_name',
    p_theme ->> 'author_url',
    coalesce(p_theme -> 'supported_features', '[]'::jsonb),
    p_theme ->> 'thumbnail_url',
    p_theme ->> 'desktop_preview_url',
    p_theme ->> 'mobile_preview_url',
    p_theme ->> 'preview_url',
    auth.uid()
  )
  returning id into v_theme;

  v_version := public.insert_theme_version(v_theme, p_version);
  update public.themes set current_version_id = v_version where id = v_theme;

  perform public.log_activity('theme.upload', 'theme', v_theme::text,
    jsonb_build_object('slug', p_theme ->> 'slug', 'version', p_version ->> 'version'));
  return v_theme;
end;
$$;

-- Adds a version without activating it, so nothing changes until an admin chooses.
create function public.add_theme_version(p_theme_id uuid, p_version jsonb)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_version uuid;
begin
  perform public.require_theme_admin();
  v_version := public.insert_theme_version(p_theme_id, p_version);
  perform public.log_activity('theme.version_upload', 'theme', p_theme_id::text,
    jsonb_build_object('version', p_version ->> 'version'));
  return v_version;
end;
$$;

-- Also how a rollback works. New websites use the active version; existing websites
-- keep the version they were built on.
create function public.activate_theme_version(p_theme_id uuid, p_version_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_version text;
begin
  perform public.require_theme_admin();

  update public.theme_versions set status = 'stable'
  where id = p_version_id and theme_id = p_theme_id
  returning version into v_version;
  if not found then
    raise exception 'Version not found' using errcode = 'P0002';
  end if;

  update public.themes set current_version_id = p_version_id where id = p_theme_id;

  perform public.log_activity('theme.version_activate', 'theme', p_theme_id::text,
    jsonb_build_object('version', v_version));
end;
$$;

create function public.update_theme(p_theme_id uuid, p_theme jsonb)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_old_category uuid;
begin
  perform public.require_theme_admin();

  select category_id into v_old_category from public.themes where id = p_theme_id;

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
  if not found then
    raise exception 'Theme not found' using errcode = 'P0002';
  end if;

  -- The listing shown to users follows the theme's details and its category.
  update public.templates set
    name = p_theme ->> 'name',
    description = p_theme ->> 'description',
    is_featured = coalesce((p_theme ->> 'is_featured')::boolean, false)
  where theme_id = p_theme_id;

  -- Replaces only the theme's main category. A listing may have others of its own.
  delete from public.template_categories tc
  using public.templates t
  where tc.template_id = t.id and t.theme_id = p_theme_id and tc.category_id = v_old_category;

  if p_theme ->> 'category_id' is not null then
    insert into public.template_categories (template_id, category_id)
    select t.id, (p_theme ->> 'category_id')::uuid
    from public.templates t where t.theme_id = p_theme_id
    on conflict do nothing;
  end if;

  perform public.log_activity('theme.update', 'theme', p_theme_id::text);
end;
$$;

-- Publishing creates the marketplace listing if the theme does not have one yet.
create function public.set_theme_status(p_theme_id uuid, p_status public.theme_status)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_theme public.themes;
  v_template uuid;
  v_slug text;
begin
  perform public.require_theme_admin();

  select * into v_theme from public.themes where id = p_theme_id for update;
  if not found then
    raise exception 'Theme not found' using errcode = 'P0002';
  end if;

  if p_status = 'published' then
    if v_theme.current_version_id is null then
      raise exception 'Upload a version before publishing this theme' using errcode = 'WT001';
    end if;
    if v_theme.category_id is null then
      raise exception 'Choose a category before publishing this theme' using errcode = 'WT002';
    end if;

    update public.theme_versions set status = 'stable'
    where id = v_theme.current_version_id and status = 'draft';

    select id into v_template from public.templates where theme_id = p_theme_id
    order by display_order limit 1;

    if v_template is null then
      v_slug := v_theme.slug;
      if exists (select 1 from public.templates where slug = v_slug) then
        v_slug := v_slug || '-' || left(replace(gen_random_uuid()::text, '-', ''), 6);
      end if;
      insert into public.templates (theme_id, name, slug, description, status, is_featured)
      values (p_theme_id, v_theme.name, v_slug, v_theme.description, 'published', v_theme.is_featured)
      returning id into v_template;
    else
      update public.templates set status = 'published' where id = v_template;
    end if;

    insert into public.template_categories (template_id, category_id)
    values (v_template, v_theme.category_id)
    on conflict do nothing;
  end if;

  update public.themes set status = p_status where id = p_theme_id;

  perform public.log_activity('theme.status_change', 'theme', p_theme_id::text,
    jsonb_build_object('from', v_theme.status, 'to', p_status));
end;
$$;

-- Copies the listing details only. The copy has no versions until one is uploaded.
create function public.duplicate_theme_metadata(p_theme_id uuid)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_source public.themes;
  v_theme uuid;
begin
  perform public.require_theme_admin();

  select * into v_source from public.themes where id = p_theme_id;
  if not found then
    raise exception 'Theme not found' using errcode = 'P0002';
  end if;

  insert into public.themes (
    name, slug, description, category_id, status, is_premium,
    author_name, author_url, supported_features, created_by
  )
  values (
    left(v_source.name || ' copy', 120),
    left(v_source.slug, 60) || '-copy-' || left(replace(gen_random_uuid()::text, '-', ''), 6),
    v_source.description, v_source.category_id, 'draft', v_source.is_premium,
    v_source.author_name, v_source.author_url, v_source.supported_features, auth.uid()
  )
  returning id into v_theme;

  perform public.log_activity('theme.duplicate', 'theme', v_theme::text,
    jsonb_build_object('source', p_theme_id));
  return v_theme;
end;
$$;

-- Deleting is safe only for a theme no website has ever been built on.
create function public.delete_theme(p_theme_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_theme public.themes;
begin
  perform public.require_theme_admin();

  select * into v_theme from public.themes where id = p_theme_id for update;
  if not found then
    raise exception 'Theme not found' using errcode = 'P0002';
  end if;
  if v_theme.status = 'published' then
    raise exception 'Unpublish this theme before deleting it' using errcode = 'WT003';
  end if;
  if exists (select 1 from public.websites where theme_id = p_theme_id) then
    raise exception 'Websites use this theme, so archive it instead' using errcode = 'WT004';
  end if;

  delete from public.templates where theme_id = p_theme_id;
  update public.themes set current_version_id = null where id = p_theme_id;
  delete from public.themes where id = p_theme_id;

  perform public.log_activity('theme.delete', 'theme', p_theme_id::text,
    jsonb_build_object('slug', v_theme.slug));
end;
$$;

revoke all on function
  public.get_theme_preview(text),
  public.require_theme_admin(),
  public.list_admin_themes(),
  public.get_admin_theme(uuid),
  public.get_admin_theme_version(uuid),
  public.insert_theme_version(uuid, jsonb),
  public.register_theme(jsonb, jsonb),
  public.add_theme_version(uuid, jsonb),
  public.activate_theme_version(uuid, uuid),
  public.update_theme(uuid, jsonb),
  public.set_theme_status(uuid, public.theme_status),
  public.duplicate_theme_metadata(uuid),
  public.delete_theme(uuid)
from public, anon;

grant execute on function public.get_theme_preview(text) to anon, authenticated;

grant execute on function
  public.require_theme_admin(),
  public.list_admin_themes(),
  public.get_admin_theme(uuid),
  public.get_admin_theme_version(uuid),
  public.register_theme(jsonb, jsonb),
  public.add_theme_version(uuid, jsonb),
  public.activate_theme_version(uuid, uuid),
  public.update_theme(uuid, jsonb),
  public.set_theme_status(uuid, public.theme_status),
  public.duplicate_theme_metadata(uuid),
  public.delete_theme(uuid)
to authenticated;

-- Reached only through register_theme and add_theme_version, so it cannot skip the audit log.
revoke all on function public.insert_theme_version(uuid, jsonb) from authenticated;
