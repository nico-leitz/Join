-- Read-only preflight check for the Sprint 3 authentication setup.
-- This script does not modify database data or structures.

with auth_user_summary as (
  select
    count(*)::integer as total_users,
    count(*) filter (
      where is_anonymous is true
    )::integer as anonymous_users,
    count(*) filter (
      where coalesce(is_anonymous, false) is false
    )::integer as permanent_users
  from auth.users
),
user_contact_matches as (
  select
    auth_user.id,
    count(contact.id)::integer as contact_matches
  from auth.users as auth_user
  left join public.contacts as contact
    on lower(trim(contact.email)) = lower(trim(auth_user.email))
  where coalesce(auth_user.is_anonymous, false) is false
  group by auth_user.id
),
match_summary as (
  select
    count(*) filter (
      where contact_matches = 0
    )::integer as users_without_contact,
    count(*) filter (
      where contact_matches = 1
    )::integer as users_with_one_contact,
    count(*) filter (
      where contact_matches > 1
    )::integer as users_with_multiple_contacts
  from user_contact_matches
),
duplicate_contact_emails as (
  select count(*)::integer as duplicate_email_groups
  from (
    select lower(trim(email))
    from public.contacts
    group by lower(trim(email))
    having count(*) > 1
  ) as duplicate_emails
),
rls_tables as (
  select
    tablename,
    rowsecurity as rls_enabled
  from pg_tables
  where schemaname = 'public'
    and tablename in (
      'contacts',
      'tasks',
      'subtasks',
      'task_assignments'
    )
),
table_columns as (
  select
    table_name,
    ordinal_position,
    column_name,
    data_type,
    is_nullable,
    column_default
  from information_schema.columns
  where table_schema = 'public'
    and table_name in (
      'contacts',
      'tasks',
      'subtasks',
      'task_assignments'
    )
),
rls_policies as (
  select
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
  from pg_policies
  where schemaname = 'public'
    and tablename in (
      'contacts',
      'tasks',
      'subtasks',
      'task_assignments'
    )
),
auth_triggers as (
  select
    trigger_name,
    action_timing,
    event_manipulation,
    action_statement
  from information_schema.triggers
  where event_object_schema = 'auth'
    and event_object_table = 'users'
)
select jsonb_pretty(
  jsonb_build_object(
    'authUsers',
    (
      select to_jsonb(auth_user_summary)
      from auth_user_summary
    ),
    'userContactMatches',
    (
      select to_jsonb(match_summary)
      from match_summary
    ),
    'duplicateContactEmails',
    (
      select duplicate_email_groups
      from duplicate_contact_emails
    ),
    'rlsTables',
    coalesce(
      (
        select jsonb_agg(
          to_jsonb(rls_tables)
          order by tablename
        )
        from rls_tables
      ),
      '[]'::jsonb
    ),
    'tableColumns',
    coalesce(
      (
        select jsonb_agg(
          to_jsonb(table_columns)
          order by table_name, ordinal_position
        )
        from table_columns
      ),
      '[]'::jsonb
    ),
    'rlsPolicies',
    coalesce(
      (
        select jsonb_agg(
          to_jsonb(rls_policies)
          order by tablename, policyname
        )
        from rls_policies
      ),
      '[]'::jsonb
    ),
    'authTriggers',
    coalesce(
      (
        select jsonb_agg(
          to_jsonb(auth_triggers)
          order by trigger_name
        )
        from auth_triggers
      ),
      '[]'::jsonb
    )
  )
) as sprint_3_auth_preflight;