select
  task.title,
  task.status,
  task.priority,
  task.category,
  task.due_date,
  count(distinct subtask.id) as subtask_count,
  count(distinct assignment.contact_id) as assigned_contact_count
from public.tasks task
left join public.subtasks subtask
  on subtask.task_id = task.id
left join public.task_assignments assignment
  on assignment.task_id = task.id
where task.title in (
  'Set up Supabase task structure',
  'Implement Add Task form',
  'Build board task cards',
  'Add task detail editing',
  'Complete sprint review checklist'
)
group by
  task.id,
  task.title,
  task.status,
  task.priority,
  task.category,
  task.due_date
order by
  task.status,
  task.sort_order;