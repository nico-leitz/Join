grant select, insert, update, delete
on table public.subtasks
to anon, authenticated;

create policy "subtasks_select"
on public.subtasks
for select
to anon, authenticated
using (true);

create policy "subtasks_insert"
on public.subtasks
for insert
to anon, authenticated
with check (true);

create policy "subtasks_update"
on public.subtasks
for update
to anon, authenticated
using (true)
with check (true);

create policy "subtasks_delete"
on public.subtasks
for delete
to anon, authenticated
using (true);