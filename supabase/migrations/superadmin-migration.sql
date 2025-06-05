-- SuperAdmin Migration Script
-- This script needs to be run in Supabase SQL Editor to enable SuperAdmin functionality

-- 1. Allow profiles to be created without school_id (for SuperAdmins)
-- Update the profiles table to allow NULL school_id
ALTER TABLE public.profiles ALTER COLUMN school_id DROP NOT NULL;

-- 2. Create RLS policy to allow SuperAdmins to read all profiles
CREATE POLICY "SuperAdmins can read all profiles" ON public.profiles
FOR SELECT TO authenticated 
USING (
  -- Allow if current user is SuperAdmin (no school_id)
  (SELECT school_id FROM public.profiles WHERE id = auth.uid()) IS NULL
);

-- 3. Create RLS policy to allow SuperAdmins to read all schools
CREATE POLICY "SuperAdmins can read all schools" ON public.schools
FOR SELECT TO authenticated 
USING (
  -- Allow if current user is SuperAdmin (no school_id)
  (SELECT school_id FROM public.profiles WHERE id = auth.uid()) IS NULL
);

-- 4. Create RLS policy to allow SuperAdmins to create schools
CREATE POLICY "SuperAdmins can create schools" ON public.schools
FOR INSERT TO authenticated 
WITH CHECK (
  -- Allow if current user is SuperAdmin (no school_id)
  (SELECT school_id FROM public.profiles WHERE id = auth.uid()) IS NULL
);

-- 5. Create RLS policy to allow SuperAdmins to update schools
CREATE POLICY "SuperAdmins can update schools" ON public.schools
FOR UPDATE TO authenticated 
USING (
  -- Allow if current user is SuperAdmin (no school_id)
  (SELECT school_id FROM public.profiles WHERE id = auth.uid()) IS NULL
)
WITH CHECK (
  -- Allow if current user is SuperAdmin (no school_id)
  (SELECT school_id FROM public.profiles WHERE id = auth.uid()) IS NULL
);

-- 6. Update the handle_new_user trigger function to allow creating users without school_id
-- First, let's check the current function and recreate it to handle SuperAdmins
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
begin
  insert into public.profiles (id, email, first_name, last_name, school_id)
  values (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    CASE 
      WHEN new.raw_user_meta_data->>'school_id' = '' THEN NULL
      ELSE (new.raw_user_meta_data->>'school_id')::uuid
    END
  );
  return new;
end;
$$ language plpgsql security definer;

-- 7. Create a function to check if a user is SuperAdmin
CREATE OR REPLACE FUNCTION public.is_superadmin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN (SELECT school_id FROM public.profiles WHERE id = user_id) IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create a function for SuperAdmins to invite school admins
CREATE OR REPLACE FUNCTION public.invite_school_admin(
  invitee_email text,
  invitee_first_name text DEFAULT '',
  invitee_last_name text DEFAULT '',
  target_school_id uuid DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  invitation_id uuid;
BEGIN
  -- Check if current user is SuperAdmin
  IF NOT public.is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'Only SuperAdmins can invite school administrators';
  END IF;

  -- Check if school exists
  IF target_school_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.schools WHERE id = target_school_id) THEN
    RAISE EXCEPTION 'School not found';
  END IF;

  -- For now, we'll just create a record to track the invitation
  -- In a real implementation, you'd integrate with an email service
  INSERT INTO public.audit_log (user_id, action, details)
  VALUES (
    auth.uid(),
    'invite_school_admin',
    jsonb_build_object(
      'invitee_email', invitee_email,
      'invitee_first_name', invitee_first_name,
      'invitee_last_name', invitee_last_name,
      'target_school_id', target_school_id
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.is_superadmin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.invite_school_admin(text, text, text, uuid) TO authenticated;

-- 10. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_school_id_null ON public.profiles (id) WHERE school_id IS NULL;

-- Note: After running this migration, you'll need to:
-- 1. Create your first SuperAdmin user manually by setting their school_id to NULL
-- 2. Set up the backend API endpoints for SuperAdmin operations
-- 3. Configure email sending for invitations (optional)

COMMENT ON FUNCTION public.is_superadmin IS 'Checks if a user is a SuperAdmin (has no school_id)';
COMMENT ON FUNCTION public.invite_school_admin IS 'Allows SuperAdmins to invite school administrators'; 