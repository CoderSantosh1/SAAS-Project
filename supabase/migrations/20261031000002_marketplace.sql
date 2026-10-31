-- Categories, themes and templates. A theme is the approved component
-- implementation; a template is a marketplace listing built on a theme.

create type public.publish_status as enum ('draft', 'published', 'archived');
create type public.theme_status as enum ('draft', 'under_review', 'published', 'unpublished', 'archived');
create type public.theme_version_status as enum ('draft', 'stable', 'deprecated');

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  icon text,
  thumbnail_url text,
  status public.publish_status not null default 'draft',
  is_featured boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index categories_listing_idx on public.categories (status, display_order);

create table public.themes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  category_id uuid references public.categories (id) on delete set null,
  status public.theme_status not null default 'draft',
  is_premium boolean not null default false,
  is_featured boolean not null default false,
  author_name text,
  author_url text,
  supported_features jsonb not null default '[]'::jsonb,
  thumbnail_url text,
  desktop_preview_url text,
  mobile_preview_url text,
  preview_url text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index themes_status_idx on public.themes (status);
create index themes_category_idx on public.themes (category_id);
create index themes_created_by_idx on public.themes (created_by);

-- component_id maps to the code-level theme registry. Uploaded packages only
-- provide data and assets and are never executed.
create table public.theme_versions (
  id uuid primary key default gen_random_uuid(),
  theme_id uuid not null references public.themes (id) on delete cascade,
  version text not null check (version ~ '^\d+\.\d+\.\d+$'),
  component_id text not null,
  status public.theme_version_status not null default 'draft',
  package_path text,
  default_config jsonb not null default '{}'::jsonb,
  design_tokens jsonb not null default '{}'::jsonb,
  compatibility jsonb not null default '{}'::jsonb,
  changelog text,
  created_at timestamptz not null default now(),
  unique (theme_id, version)
);

alter table public.themes
  add column current_version_id uuid references public.theme_versions (id) on delete set null;

create index themes_current_version_idx on public.themes (current_version_id);

create table public.theme_sections (
  id uuid primary key default gen_random_uuid(),
  theme_version_id uuid not null references public.theme_versions (id) on delete cascade,
  section_type text not null,
  label text not null,
  default_props jsonb not null default '{}'::jsonb,
  props_schema jsonb not null default '{}'::jsonb,
  display_order integer not null default 0,
  unique (theme_version_id, section_type)
);

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  theme_id uuid not null references public.themes (id) on delete restrict,
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  preview_images jsonb not null default '[]'::jsonb,
  starter_config jsonb not null default '{}'::jsonb,
  status public.publish_status not null default 'draft',
  is_featured boolean not null default false,
  is_visible boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index templates_theme_idx on public.templates (theme_id);
create index templates_listing_idx on public.templates (status, is_visible, display_order);

create table public.template_categories (
  template_id uuid not null references public.templates (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (template_id, category_id)
);

create index template_categories_category_idx on public.template_categories (category_id);

create trigger categories_set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger themes_set_updated_at before update on public.themes
  for each row execute function public.set_updated_at();
create trigger templates_set_updated_at before update on public.templates
  for each row execute function public.set_updated_at();

-- Definer helpers so public policies do not depend on the visitor being able to
-- read the parent row through its own policies.
create function public.is_theme_published(target_theme_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.themes where id = target_theme_id and status = 'published'
  );
$$;

create function public.is_theme_version_published(target_version_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.theme_versions v
    join public.themes t on t.id = v.theme_id
    where v.id = target_version_id and t.status = 'published'
  );
$$;

create function public.is_template_public(target_template_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.templates t
    join public.themes th on th.id = t.theme_id
    where t.id = target_template_id
      and t.status = 'published' and t.is_visible and th.status = 'published'
  );
$$;

alter table public.categories enable row level security;
alter table public.themes enable row level security;
alter table public.theme_versions enable row level security;
alter table public.theme_sections enable row level security;
alter table public.templates enable row level security;
alter table public.template_categories enable row level security;

create policy categories_public_select on public.categories
  for select to anon, authenticated using (status = 'published');
create policy categories_admin on public.categories
  for all to authenticated
  using (public.has_permission('categories.manage'))
  with check (public.has_permission('categories.manage'));

create policy themes_public_select on public.themes
  for select to anon, authenticated using (status = 'published');
create policy themes_admin on public.themes
  for all to authenticated
  using (public.has_permission('themes.manage'))
  with check (public.has_permission('themes.manage'));

create policy theme_versions_public_select on public.theme_versions
  for select to anon, authenticated using (public.is_theme_published(theme_id));
create policy theme_versions_admin on public.theme_versions
  for all to authenticated
  using (public.has_permission('themes.manage'))
  with check (public.has_permission('themes.manage'));

create policy theme_sections_public_select on public.theme_sections
  for select to anon, authenticated using (public.is_theme_version_published(theme_version_id));
create policy theme_sections_admin on public.theme_sections
  for all to authenticated
  using (public.has_permission('themes.manage'))
  with check (public.has_permission('themes.manage'));

create policy templates_public_select on public.templates
  for select to anon, authenticated using (public.is_template_public(id));
create policy templates_admin on public.templates
  for all to authenticated
  using (public.has_permission('templates.manage'))
  with check (public.has_permission('templates.manage'));

create policy template_categories_public_select on public.template_categories
  for select to anon, authenticated using (public.is_template_public(template_id));
create policy template_categories_admin on public.template_categories
  for all to authenticated
  using (public.has_permission('templates.manage'))
  with check (public.has_permission('templates.manage'));
