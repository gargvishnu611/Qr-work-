-- QR Work Supabase schema
-- Run this once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.app_settings (
  id text primary key default 'global',
  site_online boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.app_settings (id, site_online) values ('global', true)
on conflict (id) do nothing;

create table if not exists public.qr_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  note text,
  account_id text,
  email text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','qr-published')),
  task_id uuid,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  published_at timestamptz
);

create table if not exists public.qr_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  instructions text,
  reward numeric(12,2) not null default 25,
  minutes integer not null default 10,
  qr_image_url text not null,
  status text not null default 'open' check (status in ('open','running','submitted','accepted','rejected','expired')),
  assigned_to text default 'all',
  request_id uuid references public.qr_requests(id) on delete set null,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  submitted_at timestamptz,
  reviewed_at timestamptz
);

create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  account_id text,
  amount numeric(12,2) not null,
  method text not null,
  status text not null default 'pending' check (status in ('pending','paid','rejected')),
  created_at timestamptz not null default now()
);

alter table public.qr_requests enable row level security;
alter table public.qr_tasks enable row level security;
alter table public.app_settings enable row level security;
alter table public.withdrawals enable row level security;

-- Prototype policies. Tighten these before real production use.
drop policy if exists "public read settings" on public.app_settings;
create policy "public read settings" on public.app_settings for select to anon, authenticated using (true);
drop policy if exists "public update settings" on public.app_settings;
create policy "public update settings" on public.app_settings for update to anon, authenticated using (true) with check (true);

drop policy if exists "public read tasks" on public.qr_tasks;
create policy "public read tasks" on public.qr_tasks for select to anon, authenticated using (true);
drop policy if exists "public create tasks" on public.qr_tasks;
create policy "public create tasks" on public.qr_tasks for insert to anon, authenticated with check (true);
drop policy if exists "public update tasks" on public.qr_tasks;
create policy "public update tasks" on public.qr_tasks for update to anon, authenticated using (true) with check (true);

drop policy if exists "public read requests" on public.qr_requests;
create policy "public read requests" on public.qr_requests for select to anon, authenticated using (true);
drop policy if exists "public create requests" on public.qr_requests;
create policy "public create requests" on public.qr_requests for insert to anon, authenticated with check (true);
drop policy if exists "public update requests" on public.qr_requests;
create policy "public update requests" on public.qr_requests for update to anon, authenticated using (true) with check (true);

drop policy if exists "public read withdrawals" on public.withdrawals;
create policy "public read withdrawals" on public.withdrawals for select to anon, authenticated using (true);
drop policy if exists "public create withdrawals" on public.withdrawals;
create policy "public create withdrawals" on public.withdrawals for insert to anon, authenticated with check (true);
drop policy if exists "public update withdrawals" on public.withdrawals;
create policy "public update withdrawals" on public.withdrawals for update to anon, authenticated using (true) with check (true);

-- Storage bucket for QR photos. Create it from the Storage UI if the insert below is unavailable.
insert into storage.buckets (id, name, public) values ('qr-tasks','qr-tasks',true)
on conflict (id) do nothing;

drop policy if exists "public read qr files" on storage.objects;
create policy "public read qr files" on storage.objects for select to anon, authenticated using (bucket_id = 'qr-tasks');
drop policy if exists "public upload qr files" on storage.objects;
create policy "public upload qr files" on storage.objects for insert to anon, authenticated with check (bucket_id = 'qr-tasks');
