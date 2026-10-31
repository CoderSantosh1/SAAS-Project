-- User websites. website_pages and website_sections hold the private draft. The
-- live site renders only from an immutable website_versions snapshot, so editing
-- a draft can never change what is published.

create type public.website_status as enum ('draft', 'published', 'unpublished', 'suspended');
create type public.domain_kind as enum ('subdomain', 'custom');
create type public.domain_status as enum ('pending', 'verified', 'failed', 'suspended');

create function public.is_valid_subdomain(value text)
returns boolean
language sql immutable
set search_path = ''
as $$
  select value ~ '^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])$'
    and value not in (
      'www', 'app', 'api', 'admin', 'dashboard', 'editor', 'auth', 'login', 'register',
      'mail', 'email', 'smtp', 'ftp', 'cdn', 'static', 'assets', 'media', 'files',
      'support', 'help', 'docs', 'blog', 'status', 'billing', 'pricing', 'sites',
      'staging', 'dev', 'test', 'preview', 'ns1', 'ns2'
    );
$$;

create table public.websites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  theme_id uuid references public.themes (id) on delete restrict,
  theme_version_id uuid references public.theme_versions (id) on delete restrict,
  template_id uuid references public.templates (id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (public.is_valid_subdomain(slug)),
  business_name text,
  description text,
  thumbnail_url text,
  status public.website_status not null default 'draft',
  published_at timestamptz,
  suspended_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index websites_owner_idx on public.websites (owner_id, updated_at desc);
create index websites_status_idx on public.websites (status);
create index websites_category_idx on public.websites (category_id);
create index websites_theme_idx on public.websites (theme_id);
create index websites_theme_version_idx on public.websites (theme_version_id);
create index websites_template_idx on public.websites (template_id);

create table public.website_pages (
  id uuid primary key default gen_random_uuid(),
  website_id uuid not null references public.websites (id) on delete cascade,
  title text not null,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  is_home boolean not null default false,
  is_visible boolean not null default true,
  display_order integer not null default 0,
  seo jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (website_id, slug)
);

create unique index website_pages_one_home_idx
  on public.website_pages (website_id) where is_home;

create table public.website_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.website_pages (id) on delete cascade,
  section_type text not null,
  props jsonb not null default '{}'::jsonb,
  design jsonb not null default '{}'::jsonb,
  is_visible boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index website_sections_page_idx on public.website_sections (page_id, display_order);

create table public.website_settings (
  website_id uuid primary key references public.websites (id) on delete cascade,
  design jsonb not null default '{}'::jsonb,
  navigation jsonb not null default '[]'::jsonb,
  seo jsonb not null default '{}'::jsonb,
  contact jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.website_versions (
  id uuid primary key default gen_random_uuid(),
  website_id uuid not null references public.websites (id) on delete cascade,
  version_number integer not null,
  snapshot jsonb not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (website_id, version_number)
);

create index website_versions_created_by_idx on public.website_versions (created_by);

alter table public.websites
  add column published_version_id uuid references public.website_versions (id) on delete set null;

create index websites_published_version_idx on public.websites (published_version_id);

create table public.website_domains (
  id uuid primary key default gen_random_uuid(),
  website_id uuid not null references public.websites (id) on delete cascade,
  hostname text not null unique check (hostname = lower(hostname)),
  kind public.domain_kind not null default 'custom',
  status public.domain_status not null default 'pending',
  verification_token text not null default encode(extensions.gen_random_bytes(16), 'hex'),
  ssl_status text not null default 'pending',
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index website_domains_website_idx on public.website_domains (website_id);

create trigger websites_set_updated_at before update on public.websites
  for each row execute function public.set_updated_at();
create trigger website_pages_set_updated_at before update on public.website_pages
  for each row execute function public.set_updated_at();
create trigger website_sections_set_updated_at before update on public.website_sections
  for each row execute function public.set_updated_at();
create trigger website_settings_set_updated_at before update on public.website_settings
  for each row execute function public.set_updated_at();
create trigger website_domains_set_updated_at before update on public.website_domains
  for each row execute function public.set_updated_at();

-- Publishing and moderation state cannot be set directly by owners. Publishing
-- will go through a trusted function in the publishing phase.
create function public.guard_website_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if new.owner_id <> old.owner_id then
    raise exception 'Website owner cannot be changed' using errcode = '42501';
  end if;

  if (new.status, new.published_at, new.published_version_id, new.suspended_reason)
      is distinct from (old.status, old.published_at, old.published_version_id, old.suspended_reason)
    and not public.has_permission('websites.moderate') then
    raise exception 'Not allowed to change publishing state' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger websites_guard_update
  before update on public.websites
  for each row execute function public.guard_website_update();

-- The homepage survives page deletes. It only goes away with its website, which
-- is already gone by the time the cascade reaches this trigger.
create function public.guard_home_page_delete()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if old.is_home and exists (select 1 from public.websites where id = old.website_id) then
    raise exception 'The homepage cannot be deleted. Set another page as home first.'
      using errcode = '42501';
  end if;
  return old;
end;
$$;

create trigger website_pages_guard_delete
  before delete on public.website_pages
  for each row execute function public.guard_home_page_delete();

create function public.owns_website(target_website_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.websites where id = target_website_id and owner_id = auth.uid()
  );
$$;

create function public.owns_page(target_page_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.website_pages p
    join public.websites w on w.id = p.website_id
    where p.id = target_page_id and w.owner_id = auth.uid()
  );
$$;

-- The only public read path. Visitors never touch the website tables directly,
-- so owner details and drafts cannot leak.
create function public.get_published_site(site_slug text)
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', w.id,
    'name', w.name,
    'slug', w.slug,
    'published_at', w.published_at,
    'version', v.version_number,
    'snapshot', v.snapshot
  )
  from public.websites w
  join public.website_versions v on v.id = w.published_version_id
  join public.profiles p on p.id = w.owner_id
  where w.slug = site_slug and w.status = 'published' and p.account_status = 'active';
$$;

alter table public.websites enable row level security;
alter table public.website_pages enable row level security;
alter table public.website_sections enable row level security;
alter table public.website_settings enable row level security;
alter table public.website_versions enable row level security;
alter table public.website_domains enable row level security;

create policy websites_select on public.websites
  for select to authenticated
  using (owner_id = (select auth.uid()) or public.has_permission('websites.view'));
create policy websites_insert on public.websites
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and public.is_active_user()
    and status = 'draft'
    and published_version_id is null
    and published_at is null
  );
create policy websites_update on public.websites
  for update to authenticated
  using (
    (owner_id = (select auth.uid()) and public.is_active_user())
    or public.has_permission('websites.moderate')
  )
  with check (
    (owner_id = (select auth.uid()) and public.is_active_user())
    or public.has_permission('websites.moderate')
  );
create policy websites_delete on public.websites
  for delete to authenticated
  using (owner_id = (select auth.uid()) and public.is_active_user());

create policy website_pages_select on public.website_pages
  for select to authenticated
  using (public.owns_website(website_id) or public.has_permission('websites.view'));
create policy website_pages_write on public.website_pages
  for all to authenticated
  using (public.owns_website(website_id) and public.is_active_user())
  with check (public.owns_website(website_id) and public.is_active_user());

create policy website_sections_select on public.website_sections
  for select to authenticated
  using (public.owns_page(page_id) or public.has_permission('websites.view'));
create policy website_sections_write on public.website_sections
  for all to authenticated
  using (public.owns_page(page_id) and public.is_active_user())
  with check (public.owns_page(page_id) and public.is_active_user());

create policy website_settings_select on public.website_settings
  for select to authenticated
  using (public.owns_website(website_id) or public.has_permission('websites.view'));
create policy website_settings_write on public.website_settings
  for all to authenticated
  using (public.owns_website(website_id) and public.is_active_user())
  with check (public.owns_website(website_id) and public.is_active_user());

-- Versions are append-only history and have no update policy.
create policy website_versions_select on public.website_versions
  for select to authenticated
  using (public.owns_website(website_id) or public.has_permission('websites.view'));

-- Owners can request and remove a domain. Only trusted code can mark it verified.
create policy website_domains_select on public.website_domains
  for select to authenticated
  using (public.owns_website(website_id) or public.has_permission('domains.manage'));
create policy website_domains_insert on public.website_domains
  for insert to authenticated
  with check (
    public.owns_website(website_id)
    and public.is_active_user()
    and status = 'pending'
    and verified_at is null
  );
create policy website_domains_delete on public.website_domains
  for delete to authenticated
  using (public.owns_website(website_id) and public.is_active_user());
create policy website_domains_admin_update on public.website_domains
  for update to authenticated
  using (public.has_permission('domains.manage'))
  with check (public.has_permission('domains.manage'));
