begin;

alter table public.contacts
add column auth_user_id uuid;

alter table public.contacts
add constraint contacts_auth_user_id_key
unique (auth_user_id);

alter table public.contacts
add constraint contacts_auth_user_id_fkey
foreign key (auth_user_id)
references auth.users (id)
on delete cascade;

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
begin
  if new.is_anonymous is true or new.email is null then
    return new;
  end if;

  user_full_name := trim(
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );

  user_first_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(split_part(user_full_name, ' ', 1), ''),
    'User'
  );

  user_last_name := nullif(
    trim(new.raw_user_meta_data ->> 'last_name'),
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

  user_last_name := coalesce(user_last_name, 'Unknown');
  badge_hue := get_byte(
    decode(md5(new.id::text), 'hex'),
    0
  ) * 360 / 256;

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
    format('hsl(%s 72%% 42%%)', badge_hue),
    new.id
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

revoke execute
on function public.handle_new_auth_user()
from public, anon, authenticated;

commit;