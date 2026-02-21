alter table public.listings
  add column if not exists age int4 not null default 0,
  add column if not exists price int4 not null default 0,
  add column if not exists height text not null default '',
  add column if not exists languages text[] not null default '{}'::text[],
  add column if not exists availability text not null default 'Unavailable',
  add column if not exists verified boolean not null default false,
  add column if not exists is_top boolean not null default false,
  add column if not exists experience_years int4 not null default 0,
  add column if not exists rating numeric not null default 0,
  add column if not exists services text[] not null default '{}'::text[];
