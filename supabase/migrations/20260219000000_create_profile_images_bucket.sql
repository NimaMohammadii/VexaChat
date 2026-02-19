-- Public bucket for user profile images
insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do update
set public = true;

-- Only authenticated users can upload objects in their own namespace.
create policy if not exists "Authenticated users can upload own profile image"
on storage.objects
for insert
with check (
  bucket_id = 'profile-images'
  and auth.role() = 'authenticated'
  and split_part(name, '-', 1) = auth.uid()::text
);

-- Users can update or replace files under their own namespace.
create policy if not exists "Authenticated users can update own profile image"
on storage.objects
for update
using (
  bucket_id = 'profile-images'
  and auth.role() = 'authenticated'
  and split_part(name, '-', 1) = auth.uid()::text
)
with check (
  bucket_id = 'profile-images'
  and auth.role() = 'authenticated'
  and split_part(name, '-', 1) = auth.uid()::text
);

-- Users can delete previous files under their own namespace.
create policy if not exists "Authenticated users can delete own profile image"
on storage.objects
for delete
using (
  bucket_id = 'profile-images'
  and auth.role() = 'authenticated'
  and split_part(name, '-', 1) = auth.uid()::text
);

-- Public read access for profile images.
create policy if not exists "Public can read profile images"
on storage.objects
for select
using (bucket_id = 'profile-images');
