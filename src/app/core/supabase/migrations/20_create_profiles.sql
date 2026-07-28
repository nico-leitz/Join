begin;

create table public.profiles (
  id uuid primary key
    references auth.users (id)
    on delete cascade,
  full_name text not null
    check (length(trim(full_name)) > 0),
  badge_color text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
enable row level security;

revoke all privileges
on table public.profiles
from anon, authenticated;

grant select
on table public.profiles
to authenticated;

grant update (
  full_name,
  badge_color
)
on table public.profiles
to authenticated;

grant all privileges
on table public.profiles
to service_role;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (
  (select auth.uid()) = id
);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (
  (select auth.uid()) = id
)
with check (
  (select auth.uid()) = id
);

create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger on_profile_updated
before update on public.profiles
for each row
execute function public.set_profile_updated_at();

revoke execute
on function public.set_profile_updated_at()
from public, anon, authenticated;

insert into public.profiles (
  id,
  full_name,
  badge_color,
  created_at,
  updated_at
)
select
  auth_user.id,
  coalesce(
    nullif(
      trim(
        auth_user.raw_user_meta_data ->> 'full_name'
      ),
      ''
    ),
    nullif(
      trim(
        concat_ws(
          ' ',
          contact.first_name,
          contact.last_name
        )
      ),
      ''
    ),
    'User'
  ),
  coalesce(
    contact.badge_color,
    format(
      'hsl(%s 72%% 42%%)',
      get_byte(
        decode(md5(auth_user.id::text), 'hex'),
        0
      ) * 360 / 256
    )
  ),
  auth_user.created_at,
  now()
from auth.users as auth_user
left join public.contacts as contact
  on contact.auth_user_id = auth_user.id
where coalesce(auth_user.is_anonymous, false) is false
  and auth_user.email is not null
on conflict (id) do nothing;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  user_full_name text;
  user_first_name text;
  user_last_name text;
  badge_hue integer;
  user_badge_color text;
begin
  if coalesce(new.is_anonymous, false) is true
    or new.email is null
  then
    return new;
  end if;

  user_full_name := trim(
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      ''
    )
  );

  user_first_name := coalesce(
    nullif(
      trim(
        new.raw_user_meta_data ->> 'first_name'
      ),
      ''
    ),
    nullif(
      split_part(user_full_name, ' ', 1),
      ''
    ),
    'User'
  );

  user_last_name := nullif(
    trim(
      new.raw_user_meta_data ->> 'last_name'
    ),
    ''
  );

  if user_last_name is null
    and position(' ' in user_full_name) > 0
  then
    user_last_name := nullif(
      trim(
        substring(
          user_full_name
          from position(' ' in user_full_name) + 1
        )
      ),
      ''
    );
  end if;

  user_last_name := coalesce(
    user_last_name,
    'Unknown'
  );

  user_full_name := coalesce(
    nullif(user_full_name, ''),
    nullif(
      trim(
        concat_ws(
          ' ',
          user_first_name,
          nullif(user_last_name, 'Unknown')
        )
      ),
      ''
    ),
    'User'
  );

  badge_hue := get_byte(
    decode(md5(new.id::text), 'hex'),
    0
  ) * 360 / 256;

  user_badge_color := format(
    'hsl(%s 72%% 42%%)',
    badge_hue
  );

  insert into public.profiles (
    id,
    full_name,
    badge_color
  )
  values (
    new.id,
    user_full_name,
    user_badge_color
  )
  on conflict (id) do nothing;

  insert into public.contacts (
    first_name,
    last_name,
    email,
    badge_color,
    auth_user_id
  )
  values (
    user_first_name,
    user_last_name,
    trim(new.email),
    user_badge_color,
    new.id
  )
  on conflict (auth_user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created
on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

revoke execute
on function public.handle_new_auth_user()
from public, anon, authenticated;

commit;