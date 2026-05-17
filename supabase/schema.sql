-- ============================================================
-- Retro Garage – Supabase Schema
-- Run this in the Supabase SQL Editor (project > SQL Editor)
-- ============================================================

-- ── Products ────────────────────────────────────────────────
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text not null default '',
  ingredients  text[] not null default '{}',
  price        numeric(10,2) not null,
  images       text[] not null default '{}',
  is_available boolean not null default true,
  category     text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── Orders ──────────────────────────────────────────────────
create table if not exists public.orders (
  id                   uuid primary key default gen_random_uuid(),
  waiter_id            uuid references auth.users(id) on delete set null,
  table_number         int not null default 0,
  items                jsonb not null default '[]',
  total                numeric(10,2) not null default 0,
  status               text not null default 'pending'
                         check (status in ('pending','preparing','ready','completed','cancelled')),
  customer_preferences jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ── Orders History ──────────────────────────────────────────
create table if not exists public.orders_history (
  id                   uuid primary key,
  waiter_id            uuid,
  table_number         int not null default 0,
  items                jsonb not null default '[]',
  total                numeric(10,2) not null default 0,
  status               text not null,
  customer_preferences jsonb,
  created_at           timestamptz not null,
  archived_at          timestamptz not null default now()
);

-- ── Profiles (linked to auth.users) ─────────────────────────
create table if not exists public.profiles (
  id    uuid primary key references auth.users(id) on delete cascade,
  name  text not null default '',
  role  text not null default 'waiter'
          check (role in ('admin','chef','waiter'))
);

-- Auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email), 'waiter');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Row Level Security ───────────────────────────────────────
alter table public.products       enable row level security;
alter table public.orders         enable row level security;
alter table public.orders_history enable row level security;
alter table public.profiles       enable row level security;

-- Products: anyone authenticated can read; only admin can write
create policy "products_read"  on public.products for select using (true);
create policy "products_write" on public.products for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Orders: authenticated users can read all; waiter/admin can insert; chef/admin can update
create policy "orders_read"   on public.orders for select using (auth.role() = 'authenticated');
create policy "orders_insert" on public.orders for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('waiter','admin')));
create policy "orders_update" on public.orders for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('chef','admin')));
create policy "orders_delete" on public.orders for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Orders history: authenticated users can read; backend inserts via service role
create policy "history_read" on public.orders_history for select using (auth.role() = 'authenticated');

-- Profiles: users can read their own profile; admin can read all
create policy "profiles_read_own"  on public.profiles for select using (id = auth.uid());
create policy "profiles_read_admin" on public.profiles for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid());

-- ── Realtime ─────────────────────────────────────────────────
-- Enable in Supabase Dashboard: Database > Replication > Tables
-- Enable for: public.orders, public.products
