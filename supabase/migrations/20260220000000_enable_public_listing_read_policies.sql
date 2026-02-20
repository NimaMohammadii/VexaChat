alter table if exists public.listings enable row level security;

create policy if not exists "Public can read published listings"
on public.listings
for select
using (is_published = true);

create policy if not exists "Authenticated users can create own listings"
on public.listings
for insert
to authenticated
with check (user_id = auth.uid());

create policy if not exists "Authenticated users can update own listings"
on public.listings
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy if not exists "Authenticated users can delete own listings"
on public.listings
for delete
to authenticated
using (user_id = auth.uid());
