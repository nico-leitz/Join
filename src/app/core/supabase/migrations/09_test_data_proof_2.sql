insert into public.task_assignments (
  task_id,
  contact_id
)
select
  tasks.id,
  contacts.id
from public.tasks
cross join public.contacts
where tasks.title = 'Implement task service'
limit 1
returning *;