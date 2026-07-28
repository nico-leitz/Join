with test_user as (
  select
    id,
    email,
    encrypted_password
  from auth.users
  where lower(email) = lower(
    'join-auth-test-20260727@example.com'
  )
)
select jsonb_pretty(
  jsonb_build_object(
    'authUserCount',
    count(distinct auth_user.id),
    'profileCount',
    count(distinct profile.id),
    'contactCount',
    count(distinct contact.id),
    'passwordHashPresent',
    coalesce(
      bool_and(
        auth_user.encrypted_password is not null
        and auth_user.encrypted_password <> ''
      ),
      false
    ),
    'profileFullName',
    max(profile.full_name),
    'contactFirstName',
    max(contact.first_name),
    'contactLastName',
    max(contact.last_name),
    'uuidLinksMatch',
    coalesce(
      bool_and(
        profile.id = auth_user.id
        and contact.auth_user_id = auth_user.id
      ),
      false
    )
  )
) as auth_signup_proof
from test_user as auth_user
left join public.profiles as profile
  on profile.id = auth_user.id
left join public.contacts as contact
  on contact.auth_user_id = auth_user.id;