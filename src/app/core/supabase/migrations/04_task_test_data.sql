insert into public.tasks (
  title,
  description,
  due_date,
  priority,
  category,
  status,
  sort_order
)
values (
  'Implement task service',
  'Create the Supabase CRUD operations for tasks.',
  '2026-07-17',
  'medium',
  'technical_task',
  'todo',
  0
)
returning *;