begin;

do $$
declare
  test_task_id uuid;
  test_subtask_id uuid;
  test_contact_id uuid;
  task_count integer;
  subtask_count integer;
  assignment_count integer;
  updated_task_title text;
  updated_subtask_state boolean;
begin
  select id
  into test_contact_id
  from public.contacts
  order by created_at asc
  limit 1;

  if test_contact_id is null then
    raise exception
      'CRUD test aborted: no contact exists for assignment testing.';
  end if;

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
    'Temporary CRUD test task',
    'Temporary task used to verify database operations.',
    current_date + 7,
    'medium',
    'technical_task',
    'todo',
    999
  )
  returning id into test_task_id;

  insert into public.subtasks (
    task_id,
    title,
    is_completed,
    sort_order
  )
  values (
    test_task_id,
    'Temporary CRUD test subtask',
    false,
    0
  )
  returning id into test_subtask_id;

  insert into public.task_assignments (
    task_id,
    contact_id
  )
  values (
    test_task_id,
    test_contact_id
  );

  select count(*)
  into task_count
  from public.tasks
  where id = test_task_id;

  select count(*)
  into subtask_count
  from public.subtasks
  where id = test_subtask_id
    and task_id = test_task_id;

  select count(*)
  into assignment_count
  from public.task_assignments
  where task_id = test_task_id
    and contact_id = test_contact_id;

  if task_count <> 1 then
    raise exception 'Task create/read test failed.';
  end if;

  if subtask_count <> 1 then
    raise exception 'Subtask create/read test failed.';
  end if;

  if assignment_count <> 1 then
    raise exception 'Task assignment create/read test failed.';
  end if;

  update public.tasks
  set
    title = 'Updated temporary CRUD test task',
    priority = 'urgent',
    status = 'in_progress',
    updated_at = now()
  where id = test_task_id;

  select title
  into updated_task_title
  from public.tasks
  where id = test_task_id;

  if updated_task_title <> 'Updated temporary CRUD test task' then
    raise exception 'Task update test failed.';
  end if;

  update public.subtasks
  set
    is_completed = true,
    updated_at = now()
  where id = test_subtask_id;

  select is_completed
  into updated_subtask_state
  from public.subtasks
  where id = test_subtask_id;

  if updated_subtask_state is not true then
    raise exception 'Subtask update test failed.';
  end if;

  delete from public.tasks
  where id = test_task_id;

  select count(*)
  into task_count
  from public.tasks
  where id = test_task_id;

  select count(*)
  into subtask_count
  from public.subtasks
  where task_id = test_task_id;

  select count(*)
  into assignment_count
  from public.task_assignments
  where task_id = test_task_id;

  if task_count <> 0 then
    raise exception 'Task delete test failed.';
  end if;

  if subtask_count <> 0 then
    raise exception 'Subtask cascade delete test failed.';
  end if;

  if assignment_count <> 0 then
    raise exception 'Assignment cascade delete test failed.';
  end if;

  raise notice 'Task CRUD test passed.';
  raise notice 'Subtask CRUD test passed.';
  raise notice 'Task assignment test passed.';
  raise notice 'Cascade delete test passed.';
end
$$;

rollback;