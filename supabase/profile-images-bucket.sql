-- Create a public bucket for profile images.
insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do update set public = excluded.public;

-- Allow authenticated users to upload files for themselves only.
create policy "Users can upload their own profile images"
on storage.objects
for insert
with check (
  bucket_id = 'profile-images'
  and auth.role() = 'authenticated'
  and (storage.filename(name) like auth.uid()::text || '-%')
);

-- Allow users to update and replace files that belong to them.
create policy "Users can update their own profile images"
on storage.objects
for update
using (
  bucket_id = 'profile-images'
  and auth.role() = 'authenticated'
  and (storage.filename(name) like auth.uid()::text || '-%')
)
with check (
  bucket_id = 'profile-images'
  and auth.role() = 'authenticated'
  and (storage.filename(name) like auth.uid()::text || '-%')
);

-- Allow users to delete files that belong to them.
create policy "Users can delete their own profile images"
on storage.objects
for delete
using (
  bucket_id = 'profile-images'
  and auth.role() = 'authenticated'
  and (storage.filename(name) like auth.uid()::text || '-%')
);

-- Public read policy for profile images.
create policy "Public can view profile images"
on storage.objects
for select
using (bucket_id = 'profile-images');
