select
  tasks.title as task_title,
  subtasks.title as subtask_title,
  subtasks.is_completed
from public.subtasks
join public.tasks
  on tasks.id = subtasks.task_id;
  