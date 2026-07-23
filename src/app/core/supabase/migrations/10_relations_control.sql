select
  tasks.title as task_title,
  contacts.first_name,
  contacts.last_name,
  contacts.email
from public.task_assignments
join public.tasks
  on tasks.id = task_assignments.task_id
join public.contacts
  on contacts.id = task_assignments.contact_id;