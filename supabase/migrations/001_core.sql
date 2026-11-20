-- Yaad Doctor core schema. Idempotent: safe to run on every deploy (scripts/migrate.mjs).

-- Profiles: one per signed-in user
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  role text not null default 'broker' check (role in ('broker','admin')),
  created_at timestamptz not null default now()
);

-- Broker businesses (one owner per broker profile for v1)
create table if not exists public.brokers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null,
  company text,
  licence_type text not null default 'broker' check (licence_type in ('broker','agent','agency','sales_rep')),
  fsc_licence_no text not null,
  bio text,
  phone text,
  email text,
  whatsapp text,
  website text,
  parishes text[] not null default '{}',
  products text[] not null default '{}',
  insurers text[] not null default '{}',
  languages text[] not null default '{English}',
  status text not null default 'pending' check (status in ('pending','verified','rejected','suspended')),
  verified_at timestamptz,
  plan text not null default 'starter' check (plan in ('starter','pro','agency')),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Quote requests from the public marketplace
create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text not null,
  parish text,
  occupation text,
  coverage text[] not null default '{}',
  household_size int,
  monthly_budget text,
  current_insurer text,
  notes text,
  consent boolean not null default false,
  created_at timestamptz not null default now()
);

-- Each request can go to up to 3 brokers; each broker works its own copy
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null references public.quote_requests(id) on delete cascade,
  broker_id uuid not null references public.brokers(id) on delete cascade,
  status text not null default 'new' check (status in ('new','contacted','quoted','won','lost')),
  created_at timestamptz not null default now(),
  unique (quote_request_id, broker_id)
);

-- Broker's clients
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid not null references public.brokers(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  date_of_birth date,
  trn text,
  address text,
  parish text,
  occupation text,
  policies text,
  notes text,
  status text not null default 'active' check (status in ('prospect','active','inactive')),
  source_lead_id uuid references public.leads(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid not null references public.brokers(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  name text not null,
  storage_path text not null,
  mime text,
  size_bytes bigint,
  sha256 text,
  kind text not null default 'upload' check (kind in ('upload','signed')),
  created_at timestamptz not null default now()
);

create table if not exists public.signature_requests (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid not null references public.brokers(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  document_id uuid not null references public.documents(id) on delete cascade,
  token_hash text not null unique,
  signer_name text not null,
  signer_email text,
  signer_phone text,
  message text,
  status text not null default 'pending' check (status in ('pending','viewed','signed','declined','cancelled','expired')),
  expires_at timestamptz not null default now() + interval '14 days',
  viewed_at timestamptz,
  signed_at timestamptz,
  signed_name text,
  signer_ip text,
  signer_user_agent text,
  original_sha256 text,
  signed_document_id uuid references public.documents(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.listing_claims (
  id uuid primary key default gen_random_uuid(),
  listing_id text,
  practice_name text not null,
  contact_name text not null,
  role text,
  email text not null,
  phone text,
  wants_featured boolean not null default false,
  details text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  broker_id uuid references public.brokers(id) on delete cascade,
  actor_id uuid,
  action text not null,
  entity text,
  entity_id text,
  detail jsonb,
  created_at timestamptz not null default now()
);

create index if not exists leads_broker_idx on public.leads(broker_id, created_at desc);
create index if not exists clients_broker_idx on public.clients(broker_id, created_at desc);
create index if not exists documents_client_idx on public.documents(client_id);
create index if not exists sigreq_broker_idx on public.signature_requests(broker_id, created_at desc);
create index if not exists audit_broker_idx on public.audit_log(broker_id, created_at desc);

-- Helpers
create or replace function public.my_broker_id() returns uuid
language sql stable security definer set search_path = public as
$$ select id from public.brokers where owner_id = auth.uid() $$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;

-- New auth user -> profile row
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Brokers cannot change their own verification, plan or featured flags
create or replace function public.protect_broker_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role'
     and auth.uid() is not null then
    if tg_op = 'INSERT' then
      new.status := 'pending'; new.verified_at := null; new.plan := 'starter'; new.featured := false;
    else
      if new.fsc_licence_no is distinct from old.fsc_licence_no or new.licence_type is distinct from old.licence_type then
        new.status := 'pending'; new.verified_at := null;
      else
        new.status := old.status; new.verified_at := old.verified_at;
      end if;
      new.plan := old.plan; new.featured := old.featured; new.owner_id := old.owner_id;
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists brokers_protect on public.brokers;
create trigger brokers_protect before insert or update on public.brokers for each row execute function public.protect_broker_fields();

-- Row level security
alter table public.profiles enable row level security;
alter table public.brokers enable row level security;
alter table public.quote_requests enable row level security;
alter table public.leads enable row level security;
alter table public.clients enable row level security;
alter table public.documents enable row level security;
alter table public.signature_requests enable row level security;
alter table public.listing_claims enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

drop policy if exists "public sees verified brokers" on public.brokers;
create policy "public sees verified brokers" on public.brokers for select using (status = 'verified' or owner_id = auth.uid() or public.is_admin());
drop policy if exists "create own broker" on public.brokers;
create policy "create own broker" on public.brokers for insert with check (owner_id = auth.uid());
drop policy if exists "update own broker" on public.brokers;
create policy "update own broker" on public.brokers for update using (owner_id = auth.uid() or public.is_admin());

-- quote_requests / leads / listing_claims are written by the server with the service key only
drop policy if exists "broker reads own lead requests" on public.quote_requests;
create policy "broker reads own lead requests" on public.quote_requests for select
  using (public.is_admin() or exists (select 1 from public.leads l where l.quote_request_id = quote_requests.id and l.broker_id = public.my_broker_id()));
drop policy if exists "broker reads own leads" on public.leads;
create policy "broker reads own leads" on public.leads for select using (broker_id = public.my_broker_id() or public.is_admin());
drop policy if exists "broker updates own leads" on public.leads;
create policy "broker updates own leads" on public.leads for update using (broker_id = public.my_broker_id());
drop policy if exists "admin reads claims" on public.listing_claims;
create policy "admin reads claims" on public.listing_claims for select using (public.is_admin());

drop policy if exists "broker owns clients" on public.clients;
create policy "broker owns clients" on public.clients for all using (broker_id = public.my_broker_id()) with check (broker_id = public.my_broker_id());
drop policy if exists "broker owns documents" on public.documents;
create policy "broker owns documents" on public.documents for all using (broker_id = public.my_broker_id()) with check (broker_id = public.my_broker_id());
drop policy if exists "broker owns signature requests" on public.signature_requests;
create policy "broker owns signature requests" on public.signature_requests for all using (broker_id = public.my_broker_id()) with check (broker_id = public.my_broker_id());
drop policy if exists "broker reads own audit" on public.audit_log;
create policy "broker reads own audit" on public.audit_log for select using (broker_id = public.my_broker_id() or public.is_admin());

-- Private storage bucket for client documents, 20 MB limit, files under <broker_id>/...
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('client-docs', 'client-docs', false, 20971520,
  array['application/pdf','image/jpeg','image/png','image/webp','image/heic','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "brokers read own files" on storage.objects;
create policy "brokers read own files" on storage.objects for select
  using (bucket_id = 'client-docs' and (storage.foldername(name))[1] = public.my_broker_id()::text);
drop policy if exists "brokers upload own files" on storage.objects;
create policy "brokers upload own files" on storage.objects for insert
  with check (bucket_id = 'client-docs' and (storage.foldername(name))[1] = public.my_broker_id()::text);
drop policy if exists "brokers delete own files" on storage.objects;
create policy "brokers delete own files" on storage.objects for delete
  using (bucket_id = 'client-docs' and (storage.foldername(name))[1] = public.my_broker_id()::text);
