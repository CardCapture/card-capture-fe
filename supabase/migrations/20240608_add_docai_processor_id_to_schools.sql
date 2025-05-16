-- Add docai_processor_id column to public.schools if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='schools' AND column_name='docai_processor_id'
  ) THEN
    ALTER TABLE public.schools ADD COLUMN docai_processor_id TEXT;
  END IF;
END $$; 