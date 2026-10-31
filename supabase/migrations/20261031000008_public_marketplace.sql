-- Read functions for the public marketplace. They are security invoker, so RLS still
-- applies, and they filter on published state explicitly so that an admin browsing
-- the public site sees the same listing as a visitor.

create function public.list_marketplace_templates(
  p_category_slug text default null,
  p_search text default null,
  p_featured_only boolean default false,
  p_limit integer default 100
)
returns table (
  template_id uuid,
  template_slug text,
  name text,
  description text,
  is_featured boolean,
  is_premium boolean,
  thumbnail_url text,
  theme_slug text,
  category_names text[]
)
language sql stable
set search_path = ''
as $$
  select
    t.id,
    t.slug,
    t.name,
    t.description,
    t.is_featured,
    th.is_premium,
    th.thumbnail_url,
    th.slug,
    array(
      select c.name
      from public.template_categories tc
      join public.categories c on c.id = tc.category_id
      where tc.template_id = t.id and c.status = 'published'
      order by c.display_order
    )
  from public.templates t
  join public.themes th on th.id = t.theme_id
  where t.status = 'published'
    and t.is_visible
    and th.status = 'published'
    and (not p_featured_only or t.is_featured)
    and (
      p_category_slug is null
      or exists (
        select 1
        from public.template_categories tc
        join public.categories c on c.id = tc.category_id
        where tc.template_id = t.id and c.slug = p_category_slug and c.status = 'published'
      )
    )
    -- strpos treats the search as plain text, so % and _ have no special meaning.
    and (
      coalesce(p_search, '') = ''
      or strpos(lower(t.name || ' ' || coalesce(t.description, '')), lower(p_search)) > 0
    )
  order by t.is_featured desc, t.display_order, t.name
  limit least(greatest(p_limit, 1), 100);
$$;

create function public.list_public_categories()
returns table (
  id uuid,
  name text,
  slug text,
  description text,
  thumbnail_url text,
  is_featured boolean,
  template_count bigint
)
language sql stable
set search_path = ''
as $$
  select
    c.id,
    c.name,
    c.slug,
    c.description,
    c.thumbnail_url,
    c.is_featured,
    (
      select count(*)
      from public.template_categories tc
      where tc.category_id = c.id and public.is_template_public(tc.template_id)
    )
  from public.categories c
  where c.status = 'published'
  order by c.display_order, c.name;
$$;

create function public.get_marketplace_theme(p_theme_slug text)
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

grant execute on function
  public.list_marketplace_templates(text, text, boolean, integer),
  public.list_public_categories(),
  public.get_marketplace_theme(text)
to anon, authenticated;

update public.plans
set features = '["Create and publish websites", "Free subdomain", "All free themes", "Media library"]'::jsonb
where slug = 'free';
