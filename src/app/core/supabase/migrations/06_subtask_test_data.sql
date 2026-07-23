insert into public.subtasks (
  task_id,
  title,
  is_completed,
  sort_order
)
select
  id,
  'Define task service interfaces',
  false,
  0
from public.tasks
where title = 'Implement task service'
limit 1
returning *;
