-- Create a bulk_uploads table to record each PDF-split job
CREATE TABLE IF NOT EXISTS public.bulk_uploads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    upload_timestamp timestamptz NOT NULL DEFAULT now(),
    original_filename text,
    page_count integer NOT NULL,
    success_count integer NOT NULL DEFAULT 0,
    failure_count integer NOT NULL DEFAULT 0,
    status text NOT NULL CHECK (status IN ('pending', 'processing', 'complete', 'failed')),
    error_message text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add a trigger to update updated_at on row modification
CREATE OR REPLACE FUNCTION public.update_bulk_uploads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_bulk_uploads_updated_at
BEFORE UPDATE ON public.bulk_uploads
FOR EACH ROW EXECUTE FUNCTION public.update_bulk_uploads_updated_at(); 