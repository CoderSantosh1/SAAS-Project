-- Functions behind the user panel. Multi-table writes live here so that a website
-- is created or copied completely or not at all. They are security invoker, so RLS
-- still decides what the caller may touch.

-- A site keeps working if its theme is later unpublished, so its owner must still be
-- able to read the theme it was built on.
create policy themes_site_owner_select on public.themes
  for select to authenticated
  using (exists (
    select 1 from public.websites w
    where w.theme_id = themes.id and w.owner_id = (select auth.uid())
  ));

create policy theme_versions_site_owner_select on public.theme_versions
  for select to authenticated
  using (exists (
    select 1 from public.websites w
    where w.theme_version_id = theme_versions.id and w.owner_id = (select auth.uid())
  ));

create function public.is_subdomain_available(p_slug text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select public.is_valid_subdomain(p_slug)
    and not exists (select 1 from public.websites where slug = p_slug);
$$;

-- Definer because counting needs every user's websites. It returns only totals.
create function public.list_popular_themes(p_limit integer default 3)
returns table (theme_slug text, use_count bigint)
language sql stable security definer
set search_path = ''
as $$
  select th.slug, count(w.id)
  from public.themes th
  join public.websites w on w.theme_id = th.id
  where th.status = 'published'
  group by th.slug
  order by count(w.id) desc, th.slug
  limit least(greatest(p_limit, 1), 20);
$$;

create function public.create_website(
  p_theme_slug text,
  p_name text,
  p_slug text,
  p_category_slug text default null,
  p_business_name text default null,
  p_description text default null,
  p_design jsonb default '{}'::jsonb,
  p_contact jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_owner uuid := auth.uid();
  v_theme record;
  v_website uuid;
  v_page uuid;
  v_page_data jsonb;
  v_page_order bigint;
  v_section jsonb;
  v_section_order bigint;
  v_props jsonb;
  v_contact jsonb := jsonb_strip_nulls(coalesce(p_contact, '{}'::jsonb));
begin
  if v_owner is null then
    raise exception 'Sign in to create a website' using errcode = '28000';
  end if;

  select th.id, th.is_premium, v.id as version_id, v.default_config
  into v_theme
  from public.themes th
  join public.theme_versions v on v.id = th.current_version_id
  where th.slug = p_theme_slug and th.status = 'published';

  if not found then
    raise exception 'This theme is not available' using errcode = 'P0002';
  end if;
  if v_theme.is_premium then
    raise exception 'Premium themes are not available yet' using errcode = '42501';
  end if;

  insert into public.websites (
    owner_id, category_id, theme_id, theme_version_id, template_id,
    name, slug, business_name, description
  )
  values (
    v_owner,
    (select id from public.categories where slug = p_category_slug and status = 'published'),
    v_theme.id,
    v_theme.version_id,
    (select id from public.templates
      where theme_id = v_theme.id and status = 'published' and is_visible
      order by display_order limit 1),
    p_name, p_slug, p_business_name, p_description
  )
  returning id into v_website;

  insert into public.website_settings (website_id, design, contact)
  values (v_website, jsonb_strip_nulls(coalesce(p_design, '{}'::jsonb)), v_contact);

  for v_page_data, v_page_order in
    select value, ordinality from jsonb_array_elements(v_theme.default_config -> 'pages') with ordinality
  loop
    insert into public.website_pages (website_id, title, slug, is_home, display_order)
    values (
      v_website,
      v_page_data ->> 'title',
      v_page_data ->> 'slug',
      coalesce((v_page_data ->> 'isHome')::boolean, false),
      v_page_order * 10
    )
    returning id into v_page;

    for v_section, v_section_order in
      select value, ordinality from jsonb_array_elements(v_page_data -> 'sections') with ordinality
    loop
      v_props := v_section -> 'props';
      -- Contact sections show the owner's details or nothing, never sample ones.
      if v_section ->> 'type' = 'contact' then
        v_props := (v_props - 'email' - 'phone' - 'address' - 'hours') || v_contact;
      end if;

      insert into public.website_sections (page_id, section_type, props, display_order)
      values (v_page, v_section ->> 'type', v_props, v_section_order * 10);
    end loop;
  end loop;

  return v_website;
end;
$$;

create function public.duplicate_website(p_website_id uuid, p_name text, p_slug text)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_source public.websites;
  v_website uuid;
  v_source_page public.website_pages;
  v_page uuid;
begin
  -- Admins can read other users' sites, so ownership is checked explicitly.
  select * into v_source from public.websites
  where id = p_website_id and owner_id = auth.uid();

  if not found then
    raise exception 'Website not found' using errcode = 'P0002';
  end if;

  insert into public.websites (
    owner_id, category_id, theme_id, theme_version_id, template_id,
    name, slug, business_name, description, thumbnail_url
  )
  values (
    v_source.owner_id, v_source.category_id, v_source.theme_id, v_source.theme_version_id,
    v_source.template_id, p_name, p_slug, v_source.business_name, v_source.description,
    v_source.thumbnail_url
  )
  returning id into v_website;

  insert into public.website_settings (website_id, design, navigation, seo, contact)
  select v_website, design, navigation, seo, contact
  from public.website_settings where website_id = p_website_id;

  for v_source_page in
    select * from public.website_pages where website_id = p_website_id
  loop
    insert into public.website_pages (website_id, title, slug, is_home, is_visible, display_order, seo)
    values (
      v_website, v_source_page.title, v_source_page.slug, v_source_page.is_home,
      v_source_page.is_visible, v_source_page.display_order, v_source_page.seo
    )
    returning id into v_page;

    insert into public.website_sections (page_id, section_type, props, design, is_visible, display_order)
    select v_page, section_type, props, design, is_visible, display_order
    from public.website_sections where page_id = v_source_page.id;
  end loop;

  return v_website;
end;
$$;

create function public.list_my_websites()
returns table (
  id uuid,
  name text,
  slug text,
  status public.website_status,
  updated_at timestamptz,
  category_name text,
  theme_name text
)
language sql stable
set search_path = ''
as $$
  select w.id, w.name, w.slug, w.status, w.updated_at, c.name, th.name
  from public.websites w
  left join public.categories c on c.id = w.category_id
  left join public.themes th on th.id = w.theme_id
  where w.owner_id = auth.uid()
  order by w.updated_at desc;
$$;

-- The private draft as one document. Used by the draft preview and the editor.
create function public.get_website_draft(p_website_id uuid)
returns jsonb
language sql stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', w.id,
    'name', w.name,
    'business_name', w.business_name,
    'component_id', v.component_id,
    'version', v.version,
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

-- A schema-level default cannot remove PostgreSQL's built-in EXECUTE for PUBLIC, so
-- the one in the earlier migration did not make new functions private. This one can.
alter default privileges revoke execute on functions from public;

revoke all on function
  public.is_subdomain_available(text),
  public.list_popular_themes(integer),
  public.create_website(text, text, text, text, text, text, jsonb, jsonb),
  public.duplicate_website(uuid, text, text),
  public.list_my_websites(),
  public.get_website_draft(uuid)
from public, anon;

grant execute on function
  public.is_subdomain_available(text),
  public.list_popular_themes(integer),
  public.create_website(text, text, text, text, text, text, jsonb, jsonb),
  public.duplicate_website(uuid, text, text),
  public.list_my_websites(),
  public.get_website_draft(uuid)
to authenticated;
