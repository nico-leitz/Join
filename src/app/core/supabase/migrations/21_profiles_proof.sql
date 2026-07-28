-- Read-only verification of the profile and authentication structure.
-- This script does not modify database data or structures.

with profile_table as (
  select
    tablename,
    rowsecurity as rls_enabled
  from pg_tables
  where schemaname = 'public'
    and tablename = 'profiles'
),
profile_columns as (
  select
    ordinal_position,
    column_name,
    data_type,
    is_nullable,
    column_default
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'profiles'
),
profile_constraints as (
  select
    constraint_data.conname as constraint_name,
    constraint_data.contype as constraint_type,
    pg_get_constraintdef(
      constraint_data.oid
    ) as definition
  from pg_constraint as constraint_data
  join pg_class as table_data
    on table_data.oid = constraint_data.conrelid
  join pg_namespace as schema_data
    on schema_data.oid = table_data.relnamespace
  where schema_data.nspname = 'public'
    and table_data.relname = 'profiles'
),
profile_policies as (
  select
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
  from pg_policies
  where schemaname = 'public'
    and tablename = 'profiles'
),
profile_triggers as (
  select
    schema_data.nspname as table_schema,
    table_data.relname as table_name,
    trigger_data.tgname as trigger_name,
    pg_get_triggerdef(
      trigger_data.oid
    ) as definition
  from pg_trigger as trigger_data
  join pg_class as table_data
    on table_data.oid = trigger_data.tgrelid
  join pg_namespace as schema_data
    on schema_data.oid = table_data.relnamespace
  where trigger_data.tgisinternal is false
    and (
      (
        schema_data.nspname = 'public'
        and table_data.relname = 'profiles'
      )
      or (
        schema_data.nspname = 'auth'
        and table_data.relname = 'users'
      )
    )
),
profile_functions as (
  select
    function_data.proname as function_name,
    function_data.prosecdef as security_definer,
    function_data.proconfig as function_config,
    function_data.proacl::text as access_control
  from pg_proc as function_data
  join pg_namespace as schema_data
    on schema_data.oid = function_data.pronamespace
  where schema_data.nspname = 'public'
    and function_data.proname in (
      'handle_new_auth_user',
      'set_profile_updated_at'
    )
),
user_link_summary as (
  select
    count(*) filter (
      where coalesce(auth_user.is_anonymous, false) is false
        and auth_user.email is not null
    )::integer as eligible_auth_users,
    count(*) filter (
      where coalesce(auth_user.is_anonymous, false) is false
        and auth_user.email is not null
        and profile.id is null
    )::integer as users_without_profile,
    count(*) filter (
      where coalesce(auth_user.is_anonymous, false) is false
        and auth_user.email is not null
        and contact.auth_user_id is null
    )::integer as users_without_linked_contact,
    count(profile.id)::integer as linked_profiles,
    count(contact.auth_user_id)::integer as linked_contacts
  from auth.users as auth_user
  left join public.profiles as profile
    on profile.id = auth_user.id
  left join public.contacts as contact
    on contact.auth_user_id = auth_user.id
)
select jsonb_pretty(
  jsonb_build_object(
    'profileTable',
    coalesce(
      (
        select jsonb_agg(
          to_jsonb(profile_table)
        )
        from profile_table
      ),
      '[]'::jsonb
    ),
    'profileColumns',
    coalesce(
      (
        select jsonb_agg(
          to_jsonb(profile_columns)
          order by ordinal_position
        )
        from profile_columns
      ),
      '[]'::jsonb
    ),
    'profileConstraints',
    coalesce(
      (
        select jsonb_agg(
          to_jsonb(profile_constraints)
          order by constraint_name
        )
        from profile_constraints
      ),
      '[]'::jsonb
    ),
    'profilePolicies',
    coalesce(
      (
        select jsonb_agg(
          to_jsonb(profile_policies)
          order by policyname
        )
        from profile_policies
      ),
      '[]'::jsonb
    ),
    'relevantTriggers',
    coalesce(
      (
        select jsonb_agg(
          to_jsonb(profile_triggers)
          order by table_schema, table_name, trigger_name
        )
        from profile_triggers
      ),
      '[]'::jsonb
    ),
    'relevantFunctions',
    coalesce(
      (
        select jsonb_agg(
          to_jsonb(profile_functions)
          order by function_name
        )
        from profile_functions
      ),
      '[]'::jsonb
    ),
    'userLinks',
    (
      select to_jsonb(user_link_summary)
      from user_link_summary
    ),
    'profileCount',
    (
      select count(*)::integer
      from public.profiles
    )
  )
) as profiles_proof;