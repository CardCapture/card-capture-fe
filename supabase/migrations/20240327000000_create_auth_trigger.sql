-- Drop existing trigger and function if they exist
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Create a function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Debug logging
  raise log 'Creating new user profile with metadata:';
  raise log 'raw_user_meta_data: %', new.raw_user_meta_data;
  
  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    school_id
  )
  values (
    new.id,
    new.email,
    (new.raw_user_meta_data->>'first_name')::text,
    (new.raw_user_meta_data->>'last_name')::text,
    coalesce((new.raw_user_meta_data->>'role')::user_type, 'user'::user_type),
    (new.raw_user_meta_data->>'school_id')::uuid
  );
  return new;
end;
$$;

-- Create a trigger to call this function when a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill existing users
insert into public.profiles (id, email, first_name, last_name, role, school_id)
select 
  id,
  email,
  (raw_user_meta_data->>'first_name')::text as first_name,
  (raw_user_meta_data->>'last_name')::text as last_name,
  coalesce((raw_user_meta_data->>'role')::user_type, 'user'::user_type) as role,
  (raw_user_meta_data->>'school_id')::uuid as school_id
from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing; 