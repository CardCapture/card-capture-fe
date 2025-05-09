-- Create an audit_log table to record sensitive actions
CREATE TABLE IF NOT EXISTS public.audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    action_timestamp timestamptz NOT NULL DEFAULT now(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    action_type text NOT NULL, -- e.g., 'EXPORT', 'DELETE', 'UPDATE', etc.
    table_name text NOT NULL,
    row_id uuid, -- The primary key of the affected row, if applicable
    before_data jsonb, -- Data before the action (for DELETE/UPDATE)
    after_data jsonb,  -- Data after the action (for UPDATE/INSERT)
    extra_info jsonb,  -- Optional: for additional context (e.g., export params)
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Generic trigger function for logging changes
CREATE OR REPLACE FUNCTION public.log_table_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_log (
        user_id,
        action_type,
        table_name,
        row_id,
        before_data,
        after_data
    )
    VALUES (
        auth.uid(),
        TG_OP, -- 'INSERT', 'UPDATE', or 'DELETE'
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        CASE 
            WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD)
            ELSE NULL
        END,
        CASE 
            WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW)
            ELSE NULL
        END
    );
    
    RETURN CASE 
        WHEN TG_OP = 'DELETE' THEN OLD
        ELSE NEW
    END;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for cards table
DROP TRIGGER IF EXISTS trg_log_cards_changes ON public.cards;
CREATE TRIGGER trg_log_cards_changes
AFTER INSERT OR UPDATE OR DELETE ON public.cards
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

-- Add triggers for reviewed_data table
DROP TRIGGER IF EXISTS trg_log_reviewed_data_changes ON public.reviewed_data;
CREATE TRIGGER trg_log_reviewed_data_changes
AFTER INSERT OR UPDATE OR DELETE ON public.reviewed_data
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

-- Add triggers for extracted_data table
DROP TRIGGER IF EXISTS trg_log_extracted_data_changes ON public.extracted_data;
CREATE TRIGGER trg_log_extracted_data_changes
AFTER INSERT OR UPDATE OR DELETE ON public.extracted_data
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

-- Add triggers for processing_jobs table
DROP TRIGGER IF EXISTS trg_log_processing_jobs_changes ON public.processing_jobs;
CREATE TRIGGER trg_log_processing_jobs_changes
AFTER INSERT OR UPDATE OR DELETE ON public.processing_jobs
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

-- Add triggers for profiles table (sensitive user data)
DROP TRIGGER IF EXISTS trg_log_profiles_changes ON public.profiles;
CREATE TRIGGER trg_log_profiles_changes
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

-- Add triggers for schools table (organization data)
DROP TRIGGER IF EXISTS trg_log_schools_changes ON public.schools;
CREATE TRIGGER trg_log_schools_changes
AFTER INSERT OR UPDATE OR DELETE ON public.schools
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

-- Add RLS policy for audit_log table
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
    ON public.audit_log
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Grant necessary permissions
GRANT SELECT ON public.audit_log TO authenticated;
GRANT INSERT ON public.audit_log TO authenticated; 