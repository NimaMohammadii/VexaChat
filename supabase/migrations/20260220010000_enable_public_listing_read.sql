alter table if exists public.listings enable row level security;

create policy if not exists "Public can read published listings"
on public.listings
for select
using (is_published = true);
