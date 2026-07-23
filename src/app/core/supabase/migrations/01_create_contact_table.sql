create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  badge_color text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.contacts enable row level security;

create policy "Allow public read contacts"
on public.contacts
for select
to anon
using (true);

create policy "Allow public insert contacts"
on public.contacts
for insert
to anon
with check (true);

create policy "Allow public update contacts"
on public.contacts
for update
to anon
using (true)
with check (true);

create policy "Allow public delete contacts"
on public.contacts
for delete
to anon
using (true);