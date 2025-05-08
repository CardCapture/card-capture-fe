-- Add missing columns to public.schools if they do not exist

-- Add pricing_tier column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='schools' AND column_name='pricing_tier'
  ) THEN
    ALTER TABLE public.schools ADD COLUMN pricing_tier TEXT;
  END IF;
END $$;

-- Add stripe_price_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='schools' AND column_name='stripe_price_id'
  ) THEN
    ALTER TABLE public.schools ADD COLUMN stripe_price_id TEXT;
  END IF;
END $$;

-- Add has_paid column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='schools' AND column_name='has_paid'
  ) THEN
    ALTER TABLE public.schools ADD COLUMN has_paid BOOLEAN DEFAULT false;
  END IF;
END $$; 