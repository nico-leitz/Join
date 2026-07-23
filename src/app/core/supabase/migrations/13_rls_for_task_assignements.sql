grant select, insert, update, delete
on table public.task_assignments
to anon, authenticated;

create policy "task_assignments_select"
on public.task_assignments
for select
to anon, authenticated
using (true);

create policy "task_assignments_insert"
on public.task_assignments
for insert
to anon, authenticated
with check (true);

create policy "task_assignments_update"
on public.task_assignments
for update
to anon, authenticated
using (true)
with check (true);

create policy "task_assignments_delete"
on public.task_assignments
for delete
to anon, authenticated
using (true);