grant select, insert, update, delete
on table public.tasks
to anon, authenticated;

create policy "tasks_select"
on public.tasks
for select
to anon, authenticated
using (true);

create policy "tasks_insert"
on public.tasks
for insert
to anon, authenticated
with check (true);

create policy "tasks_update"
on public.tasks
for update
to anon, authenticated
using (true)
with check (true);

create policy "tasks_delete"
on public.tasks
for delete
to anon, authenticated
using (true);