-- Create schools table first
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add school_id column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);

-- Make school_id nullable
ALTER TABLE public.profiles
ALTER COLUMN school_id DROP NOT NULL;

-- Drop existing trigger and function if they exist
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Create a function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_school_id uuid;
begin
  -- Debug logging
  raise log 'Creating new user profile with metadata:';
  raise log 'raw_user_meta_data: %', new.raw_user_meta_data;
  raise log 'raw_app_meta_data: %', new.raw_app_meta_data;
  
  -- Try to get school_id from both metadata sources
  v_school_id := (new.raw_user_meta_data->>'school_id')::uuid;
  if v_school_id is null then
    v_school_id := (new.raw_app_meta_data->>'school_id')::uuid;
  end if;
  
  raise log 'Extracted school_id: %', v_school_id;
  
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
    v_school_id
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
  coalesce(
    (raw_user_meta_data->>'school_id')::uuid,
    (raw_app_meta_data->>'school_id')::uuid
  ) as school_id
from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing; 