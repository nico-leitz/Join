-- Verifies the authentication-to-contact relation without changing data.

with contact_column as (
  select
    column_name,
    data_type,
    is_nullable
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'contacts'
    and column_name = 'auth_user_id'
),
contact_constraints as (
  select
    constraint_name,
    constraint_type
  from information_schema.table_constraints
  where table_schema = 'public'
    and table_name = 'contacts'
    and constraint_name in (
      'contacts_auth_user_id_key',
      'contacts_auth_user_id_fkey'
    )
),
auth_trigger as (
  select
    trigger_name,
    action_timing,
    event_manipulation,
    action_statement
  from information_schema.triggers
  where event_object_schema = 'auth'
    and event_object_table = 'users'
    and trigger_name = 'on_auth_user_created'
),
trigger_function as (
  select
    proc.proname as function_name,
    proc.prosecdef as security_definer,
    proc.proconfig as function_config,
    proc.proacl::text as access_control
  from pg_proc as proc
  join pg_namespace as schema_namespace
    on schema_namespace.oid = proc.pronamespace
  where schema_namespace.nspname = 'public'
    and proc.proname = 'handle_new_auth_user'
)
select jsonb_pretty(
  jsonb_build_object(
    'authUserColumn',
    coalesce(
      (
        select jsonb_agg(to_jsonb(contact_column))
        from contact_column
      ),
      '[]'::jsonb
    ),
    'constraints',
    coalesce(
      (
        select jsonb_agg(
          to_jsonb(contact_constraints)
          order by constraint_name
        )
        from contact_constraints
      ),
      '[]'::jsonb
    ),
    'authTrigger',
    coalesce(
      (
        select jsonb_agg(to_jsonb(auth_trigger))
        from auth_trigger
      ),
      '[]'::jsonb
    ),
    'triggerFunction',
    coalesce(
      (
        select jsonb_agg(to_jsonb(trigger_function))
        from trigger_function
      ),
      '[]'::jsonb
    ),
    'contactCount',
    (
      select count(*)::integer
      from public.contacts
    ),
    'linkedContactCount',
    (
      select count(*)::integer
      from public.contacts
      where auth_user_id is not null
    )
  )
) as auth_contact_relation_proof;