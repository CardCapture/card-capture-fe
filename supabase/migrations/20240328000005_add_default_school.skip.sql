-- Add a default school if none exists
DO $$
BEGIN
    -- Check if the table and columns exist
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'schools' 
        AND column_name = 'pricing_tier'
    ) THEN
        IF NOT EXISTS (SELECT 1 FROM public.schools LIMIT 1) THEN
            INSERT INTO public.schools (id, name, pricing_tier, stripe_price_id)
            VALUES (
                '00000000-0000-0000-0000-000000000001',
                'Default School',
                'starter',
                'price_1PJQYd2eZvKYlo2C0JXJXJXJ'  -- Replace with your actual Stripe price ID
            );
        END IF;
    END IF;
END $$; 