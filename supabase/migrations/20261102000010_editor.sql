-- Functions behind the visual editor. The draft is saved as one transaction, and
-- draft_revision stops a second tab or device from silently overwriting newer work.

alter table public.websites add column draft_revision integer not null default 0;

-- Checkpoints are private restore points of the draft. Only a published version can
-- be served to visitors, and a website's published_version_id is set by trusted code.
alter table public.website_versions
  add column kind text not null default 'published' check (kind in ('checkpoint', 'published')),
  add column label text check (char_length(label) <= 80);

create index website_versions_history_idx
  on public.website_versions (website_id, kind, version_number desc);

create function public.get_website_editor(p_website_id uuid)
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
    'version', v.version,
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

-- The draft preview now also needs each section's design.
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

-- Security invoker, so RLS also refuses any page or section id another user owns.
create function public.save_website_draft(
  p_website_id uuid,
  p_expected_revision integer,
  p_document jsonb
)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_revision integer;
  v_pages jsonb := p_document -> 'pages';
  v_page jsonb;
  v_page_order bigint;
  v_section jsonb;
  v_section_order bigint;
begin
  select draft_revision into v_revision
  from public.websites
  where id = p_website_id and owner_id = auth.uid()
  for update;

  if not found then
    raise exception 'Website not found' using errcode = 'P0002';
  end if;
  if v_revision <> p_expected_revision then
    raise exception 'This draft was changed somewhere else' using errcode = 'WV001';
  end if;

  if jsonb_typeof(v_pages) is distinct from 'array' or jsonb_array_length(v_pages) not between 1 and 50 then
    raise exception 'A website needs between 1 and 50 pages' using errcode = '22023';
  end if;
  if (
    select count(*) from jsonb_array_elements(v_pages) page
    where coalesce((page ->> 'isHome')::boolean, false)
  ) <> 1 then
    raise exception 'A website needs exactly one homepage' using errcode = '22023';
  end if;

  -- Clearing these first lets the homepage move, and lets two pages swap slugs.
  update public.website_pages
  set is_home = false,
    slug = 'tmp-' || replace(gen_random_uuid()::text, '-', '')
  where website_id = p_website_id;

  delete from public.website_pages
  where website_id = p_website_id
    and id not in (select (page ->> 'id')::uuid from jsonb_array_elements(v_pages) page);

  delete from public.website_sections sec
  using public.website_pages p
  where sec.page_id = p.id
    and p.website_id = p_website_id
    and sec.id not in (
      select (section ->> 'id')::uuid
      from jsonb_array_elements(v_pages) page,
        jsonb_array_elements(page -> 'sections') section
    );

  for v_page, v_page_order in
    select value, ordinality from jsonb_array_elements(v_pages) with ordinality
  loop
    insert into public.website_pages (id, website_id, title, slug, is_home, is_visible, display_order, seo)
    values (
      (v_page ->> 'id')::uuid,
      p_website_id,
      v_page ->> 'title',
      v_page ->> 'slug',
      coalesce((v_page ->> 'isHome')::boolean, false),
      coalesce((v_page ->> 'isVisible')::boolean, true),
      v_page_order * 10,
      coalesce(v_page -> 'seo', '{}'::jsonb)
    )
    on conflict (id) do update set
      title = excluded.title,
      slug = excluded.slug,
      is_home = excluded.is_home,
      is_visible = excluded.is_visible,
      display_order = excluded.display_order,
      seo = excluded.seo;

    for v_section, v_section_order in
      select value, ordinality from jsonb_array_elements(v_page -> 'sections') with ordinality
    loop
      insert into public.website_sections (id, page_id, section_type, props, design, is_visible, display_order)
      values (
        (v_section ->> 'id')::uuid,
        (v_page ->> 'id')::uuid,
        v_section ->> 'type',
        coalesce(v_section -> 'props', '{}'::jsonb),
        coalesce(v_section -> 'design', '{}'::jsonb),
        coalesce((v_section ->> 'isVisible')::boolean, true),
        v_section_order * 10
      )
      on conflict (id) do update set
        page_id = excluded.page_id,
        section_type = excluded.section_type,
        props = excluded.props,
        design = excluded.design,
        is_visible = excluded.is_visible,
        display_order = excluded.display_order;
    end loop;
  end loop;

  insert into public.website_settings (website_id, design)
  values (p_website_id, coalesce(p_document -> 'design', '{}'::jsonb))
  on conflict (website_id) do update set design = excluded.design;

  update public.websites
  set name = p_document ->> 'name',
    business_name = p_document ->> 'businessName',
    draft_revision = draft_revision + 1
  where id = p_website_id
  returning draft_revision into v_revision;

  return v_revision;
end;
$$;

-- Definer because website_versions has no client write path. Ownership is checked
-- here, and the snapshot comes from the saved rows, not from the caller.
create function public.create_website_checkpoint(p_website_id uuid, p_label text default null)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_version uuid;
begin
  if not public.is_active_user() or not public.owns_website(p_website_id) then
    raise exception 'Website not found' using errcode = 'P0002';
  end if;

  -- Serializes version numbers for this website.
  perform 1 from public.websites where id = p_website_id for update;

  insert into public.website_versions (website_id, version_number, snapshot, created_by, kind, label)
  select
    p_website_id,
    coalesce((select max(version_number) from public.website_versions where website_id = p_website_id), 0) + 1,
    public.get_website_editor(p_website_id) -> 'document',
    auth.uid(),
    'checkpoint',
    p_label
  returning id into v_version;

  -- Keeps the newest 50 checkpoints. Published versions are never pruned.
  delete from public.website_versions
  where website_id = p_website_id
    and kind = 'checkpoint'
    and id not in (
      select id from public.website_versions
      where website_id = p_website_id and kind = 'checkpoint'
      order by version_number desc
      limit 50
    );

  return v_version;
end;
$$;

revoke all on function
  public.get_website_editor(uuid),
  public.save_website_draft(uuid, integer, jsonb),
  public.create_website_checkpoint(uuid, text)
from public, anon;

grant execute on function
  public.get_website_editor(uuid),
  public.save_website_draft(uuid, integer, jsonb),
  public.create_website_checkpoint(uuid, text)
to authenticated;
