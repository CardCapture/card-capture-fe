-- Drop existing policies
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow inserts from trigger" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new policies
-- Allow authenticated users to read profiles in their school
CREATE POLICY "Users can read profiles in same school"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        school_id IN (
            SELECT school_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow inserts from trigger for new user creation
CREATE POLICY "Allow trigger inserts"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles"
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