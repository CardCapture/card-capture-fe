-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can read their own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Allow users to read profiles of users in their school
CREATE POLICY "Users can read profiles in their school"
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
CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow the service role to manage all profiles
CREATE POLICY "Service role can manage all profiles"
    ON public.profiles
    TO service_role
    USING (true)
    WITH CHECK (true); 