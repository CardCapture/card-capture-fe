-- First, drop ALL existing policies on the profiles table
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow inserts from trigger" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read profiles in same school" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

-- Disable RLS temporarily to avoid any issues during policy updates
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create new policies with unique names
CREATE POLICY "profiles_read_own"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Then allow reading profiles in the same school
CREATE POLICY "profiles_read_same_school"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        id != auth.uid() AND  -- Don't apply this policy to own profile
        school_id IN (
            SELECT school_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- Allow users to update their own profile
CREATE POLICY "profiles_update_own"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow inserts from trigger for new user creation
CREATE POLICY "profiles_insert_trigger"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow admins to update all profiles
CREATE POLICY "profiles_admin_update"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    ); 