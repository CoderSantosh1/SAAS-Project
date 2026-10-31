-- Media records and storage buckets. User files sit under <user id>/ in their own
-- bucket, separate from platform files. Theme packages are in a private bucket.

create type public.media_scope as enum ('user', 'platform');

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  scope public.media_scope not null,
  owner_id uuid references public.profiles (id) on delete cascade,
  bucket text not null,
  path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  width integer,
  height integer,
  alt_text text,
  created_at timestamptz not null default now(),
  unique (bucket, path),
  check (
    (scope = 'user' and owner_id is not null and bucket = 'user-media')
    or (scope = 'platform' and owner_id is null and bucket = 'platform-media')
  )
);

create index media_assets_owner_idx on public.media_assets (owner_id, created_at desc);
create index media_assets_scope_idx on public.media_assets (scope, created_at desc);

alter table public.media_assets enable row level security;

create policy media_assets_select on public.media_assets
  for select to authenticated
  using (
    owner_id = (select auth.uid())
    or (scope = 'platform' and public.has_permission('media.manage'))
    or (scope = 'user' and public.has_permission('media.view_user'))
  );
create policy media_assets_owner_insert on public.media_assets
  for insert to authenticated
  with check (
    scope = 'user' and owner_id = (select auth.uid()) and public.is_active_user()
    and path like (select auth.uid())::text || '/%'
  );
create policy media_assets_owner_update on public.media_assets
  for update to authenticated
  using (scope = 'user' and owner_id = (select auth.uid()) and public.is_active_user())
  with check (
    scope = 'user' and owner_id = (select auth.uid())
    and path like (select auth.uid())::text || '/%'
  );
create policy media_assets_owner_delete on public.media_assets
  for delete to authenticated
  using (scope = 'user' and owner_id = (select auth.uid()) and public.is_active_user());
create policy media_assets_platform_write on public.media_assets
  for all to authenticated
  using (scope = 'platform' and public.has_permission('media.manage'))
  with check (scope = 'platform' and public.has_permission('media.manage'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('user-media', 'user-media', true, 10485760,
    array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']),
  ('platform-media', 'platform-media', true, 10485760,
    array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif', 'image/x-icon']),
  ('theme-packages', 'theme-packages', false, 52428800,
    array['application/zip', 'application/x-zip-compressed']);

create policy user_media_public_read on storage.objects
  for select to anon, authenticated using (bucket_id = 'user-media');
create policy user_media_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'user-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.is_active_user()
  );
create policy user_media_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'user-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.is_active_user()
  )
  with check (
    bucket_id = 'user-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy user_media_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'user-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.is_active_user()
  );

create policy platform_media_public_read on storage.objects
  for select to anon, authenticated using (bucket_id = 'platform-media');
create policy platform_media_write on storage.objects
  for all to authenticated
  using (bucket_id = 'platform-media' and public.has_permission('media.manage'))
  with check (bucket_id = 'platform-media' and public.has_permission('media.manage'));

create policy theme_packages_admin on storage.objects
  for all to authenticated
  using (bucket_id = 'theme-packages' and public.has_permission('themes.manage'))
  with check (bucket_id = 'theme-packages' and public.has_permission('themes.manage'));
