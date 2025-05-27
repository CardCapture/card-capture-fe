-- Drop the existing view
DROP VIEW IF EXISTS public.user_profiles_with_login;

-- Recreate the view using the new array-based role column from profiles
CREATE OR REPLACE VIEW public.user_profiles_with_login AS
SELECT
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    u.last_sign_in_at
FROM
    public.profiles p
    LEFT JOIN auth.users u ON p.id = u.id;

-- Grant permissions
GRANT SELECT ON public.user_profiles_with_login TO authenticated;
GRANT SELECT ON public.user_profiles_with_login TO service_role; 