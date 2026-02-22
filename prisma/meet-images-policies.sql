-- Supabase Storage policies for bucket: meet-images
-- Create bucket first in Supabase dashboard: meet-images (private/authenticated)

-- Allow authenticated users to read meet images (authenticated-only)
create policy "meet_images_select_authenticated"
on storage.objects for select
using (
  bucket_id = 'meet-images'
  and auth.role() = 'authenticated'
);

-- Users can upload only to their own folder: {userId}/...
create policy "meet_images_insert_own_folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'meet-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "meet_images_update_own_folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'meet-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'meet-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "meet_images_delete_own_folder"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'meet-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
