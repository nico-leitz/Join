begin;

alter table public.contacts
enable row level security;

revoke all privileges
on table public.contacts
from anon;

grant select, insert, update, delete
on table public.contacts
to authenticated;

drop policy if exists "Authenticated users can read contacts"
on public.contacts;

drop policy if exists "Authenticated users can create contacts"
on public.contacts;

drop policy if exists "Authenticated users can update contacts"
on public.contacts;

drop policy if exists "Authenticated users can delete contacts"
on public.contacts;

create policy "Authenticated users can read contacts"
on public.contacts
for select
to authenticated
using (true);

create policy "Authenticated users can create contacts"
on public.contacts
for insert
to authenticated
with check (true);

create policy "Authenticated users can update contacts"
on public.contacts
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete contacts"
on public.contacts
for delete
to authenticated
using (true);

commit;