 -- Create integration_credentials table with encrypted sensitive fields
CREATE TABLE IF NOT EXISTS public.integration_credentials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
    host text NOT NULL,
    port integer NOT NULL,
    username text NOT NULL,
    encrypted_secret bytea NOT NULL, -- Encrypted password or private key
    secret_nonce bytea NOT NULL,     -- Nonce for decryption
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add a trigger to update updated_at on row modification
CREATE OR REPLACE FUNCTION public.update_integration_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_integration_credentials_updated_at
BEFORE UPDATE ON public.integration_credentials
FOR EACH ROW EXECUTE FUNCTION public.update_integration_credentials_updated_at();
