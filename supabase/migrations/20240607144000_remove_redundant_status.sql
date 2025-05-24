-- Remove redundant status field from reviewed_data
ALTER TABLE public.reviewed_data DROP COLUMN IF EXISTS status; 