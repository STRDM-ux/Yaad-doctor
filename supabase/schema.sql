-- Yaad Doctor: listings table for Supabase (Postgres + PostGIS). Load data/listings.json with scripts/seed or the Supabase CSV import.
create extension if not exists postgis;
create table if not exists listings (
  id text primary key,
  name text not null,
  kind text not null check (kind in ('doctor','hospital','clinic','dentist','pharmacy','lab')),
  person boolean default false,
  practice text,
  specialties text[] default '{}',
  services text[] default '{}',
  phones text[] default '{}',
  email text,
  website text,
  address text,
  parish text,
  location geography(point, 4326),
  approx_location boolean default false,
  hours text,
  emergency boolean default false,
  sector text,
  photo_url text,            -- only photos the practice itself publishes
  insurers_accepted text[] default '{}', -- filled only when a practice confirms
  sources jsonb not null,    -- [{name,url,date}]
  claimed boolean default false,
  updated_at timestamptz default now()
);
create index if not exists listings_location_idx on listings using gist (location);
create index if not exists listings_parish_idx on listings (parish);
alter table listings enable row level security;
create policy "public read" on listings for select using (true);
