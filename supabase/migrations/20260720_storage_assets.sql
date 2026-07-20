-- ============================================
-- Project asset storage (image uploads in the builder)
-- Creates a public-read bucket where each user writes only under their own
-- {user_id}/ folder. Idempotent.
-- ============================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-assets',
  'project-assets',
  true,
  10485760, -- 10 MB
  array['image/png','image/jpeg','image/gif','image/webp','image/svg+xml','image/avif']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 10485760,
      allowed_mime_types = array['image/png','image/jpeg','image/gif','image/webp','image/svg+xml','image/avif'];

-- Anyone can read (published sites serve these images).
drop policy if exists "Project assets are publicly readable" on storage.objects;
create policy "Project assets are publicly readable"
  on storage.objects for select
  using (bucket_id = 'project-assets');

-- Authenticated users may write only inside their own top-level folder.
drop policy if exists "Users upload own project assets" on storage.objects;
create policy "Users upload own project assets"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'project-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users update own project assets" on storage.objects;
create policy "Users update own project assets"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'project-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users delete own project assets" on storage.objects;
create policy "Users delete own project assets"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'project-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
