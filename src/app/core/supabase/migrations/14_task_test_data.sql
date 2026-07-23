begin;

delete from public.tasks
where title in (
  'Set up Supabase task structure',
  'Implement Add Task form',
  'Build board task cards',
  'Add task detail editing',
  'Complete sprint review checklist'
);

with inserted_tasks as (
  insert into public.tasks (
    title,
    description,
    due_date,
    priority,
    category,
    status,
    sort_order
  )
  values
    (
      'Set up Supabase task structure',
      'Create and verify the database tables, constraints, relations and access policies required for task management.',
      '2026-07-20',
      'urgent',
      'technical_task',
      'in_progress',
      0
    ),
    (
      'Implement Add Task form',
      'Build the task creation form with validation for title, due date, priority, category, assigned contacts and subtasks.',
      '2026-07-22',
      'medium',
      'user_story',
      'todo',
      0
    ),
    (
      'Build board task cards',
      'Display persisted tasks in the correct board columns including category, title, description, contacts, priority and subtask progress.',
      '2026-07-24',
      'medium',
      'technical_task',
      'in_progress',
      1
    ),
    (
      'Add task detail editing',
      'Allow users to inspect, edit and delete an existing task together with its subtasks and assigned contacts.',
      '2026-07-25',
      'urgent',
      'user_story',
      'awaiting_feedback',
      0
    ),
    (
      'Complete sprint review checklist',
      'Verify the implemented task workflow against the Sprint 2 definition of done and document remaining issues.',
      '2026-07-18',
      'low',
      'technical_task',
      'done',
      0
    )
  returning id, title
),
inserted_subtasks as (
  insert into public.subtasks (
    task_id,
    title,
    is_completed,
    sort_order
  )
  select
    task.id,
    subtask.title,
    subtask.is_completed,
    subtask.sort_order
  from inserted_tasks task
  join (
    values
      (
        'Set up Supabase task structure',
        'Create task tables',
        true,
        0
      ),
      (
        'Set up Supabase task structure',
        'Configure row level security policies',
        true,
        1
      ),
      (
        'Set up Supabase task structure',
        'Test foreign key relations',
        false,
        2
      ),
      (
        'Implement Add Task form',
        'Add required field validation',
        false,
        0
      ),
      (
        'Implement Add Task form',
        'Connect contact selection',
        false,
        1
      ),
      (
        'Implement Add Task form',
        'Persist subtasks with the new task',
        false,
        2
      ),
      (
        'Build board task cards',
        'Render task metadata',
        true,
        0
      ),
      (
        'Build board task cards',
        'Display assigned contact badges',
        false,
        1
      ),
      (
        'Build board task cards',
        'Display subtask progress',
        false,
        2
      ),
      (
        'Add task detail editing',
        'Load complete task details',
        true,
        0
      ),
      (
        'Add task detail editing',
        'Synchronize edited relations',
        false,
        1
      ),
      (
        'Complete sprint review checklist',
        'Check task CRUD operations',
        true,
        0
      ),
      (
        'Complete sprint review checklist',
        'Check subtask operations',
        true,
        1
      ),
      (
        'Complete sprint review checklist',
        'Check contact assignments',
        true,
        2
      )
  ) as subtask(
    task_title,
    title,
    is_completed,
    sort_order
  )
    on subtask.task_title = task.title
  returning id
),
available_contacts as (
  select
    id,
    row_number() over (
      order by first_name, last_name, id
    ) as contact_number
  from public.contacts
  order by first_name, last_name, id
  limit 4
),
inserted_assignments as (
  insert into public.task_assignments (
    task_id,
    contact_id
  )
  select
    task.id,
    contact.id
  from inserted_tasks task
  join available_contacts contact
    on (
      task.title = 'Set up Supabase task structure'
      and contact.contact_number in (1, 2)
    )
    or (
      task.title = 'Implement Add Task form'
      and contact.contact_number in (2, 3)
    )
    or (
      task.title = 'Build board task cards'
      and contact.contact_number in (1, 3, 4)
    )
    or (
      task.title = 'Add task detail editing'
      and contact.contact_number in (2, 4)
    )
    or (
      task.title = 'Complete sprint review checklist'
      and contact.contact_number = 1
    )
  returning task_id, contact_id
)
select
  (
    select count(*)
    from inserted_tasks
  ) as inserted_tasks,
  (
    select count(*)
    from inserted_subtasks
  ) as inserted_subtasks,
  (
    select count(*)
    from inserted_assignments
  ) as inserted_assignments;

commit;