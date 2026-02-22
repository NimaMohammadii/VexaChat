-- Supabase Storage bucket: meet-images
-- Recommended: authenticated read only

create policy "meet images authenticated read"
on storage.objects for select
to authenticated
using (bucket_id = 'meet-images');

create policy "meet images own folder insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'meet-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "meet images own folder update"
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

create policy "meet images own folder delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'meet-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
