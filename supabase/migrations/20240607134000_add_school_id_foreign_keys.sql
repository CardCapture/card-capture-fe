-- Robustly add foreign key constraints for school_id to schools(id) in all relevant tables

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'extracted_data'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name = 'fk_extracted_data_school_id'
  ) THEN
    ALTER TABLE extracted_data
      ADD CONSTRAINT fk_extracted_data_school_id FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'reviewed_data'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name = 'fk_reviewed_data_school_id'
  ) THEN
    ALTER TABLE reviewed_data
      ADD CONSTRAINT fk_reviewed_data_school_id FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'events'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name = 'fk_events_school_id'
  ) THEN
    ALTER TABLE events
      ADD CONSTRAINT fk_events_school_id FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- 1. Drop all policies on processing_jobs
DROP POLICY IF EXISTS school_select ON processing_jobs;
DROP POLICY IF EXISTS school_insert ON processing_jobs;
DROP POLICY IF EXISTS school_update ON processing_jobs;
DROP POLICY IF EXISTS admin_delete ON processing_jobs;

-- 2. Convert school_id from text to uuid if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'processing_jobs'
      AND column_name = 'school_id'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE processing_jobs
      ALTER COLUMN school_id TYPE uuid USING school_id::uuid;
  END IF;
END $$;

-- 3. Add the FK constraint if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'processing_jobs'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name = 'fk_processing_jobs_school_id'
  ) THEN
    ALTER TABLE processing_jobs
      ADD CONSTRAINT fk_processing_jobs_school_id FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- 4. Recreate the policies
CREATE POLICY school_select ON processing_jobs FOR SELECT USING (school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY school_insert ON processing_jobs FOR INSERT WITH CHECK (school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY school_update ON processing_jobs FOR UPDATE USING (school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())) WITH CHECK (school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY admin_delete ON processing_jobs FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'card_actions'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name = 'fk_card_actions_school_id'
  ) THEN
    ALTER TABLE card_actions
      ADD CONSTRAINT fk_card_actions_school_id FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'cards'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name = 'fk_cards_school_id'
  ) THEN
    ALTER TABLE cards
      ADD CONSTRAINT fk_cards_school_id FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'user_actions'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name = 'fk_user_actions_school_id'
  ) THEN
    ALTER TABLE user_actions
      ADD CONSTRAINT fk_user_actions_school_id FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;
  END IF;
END $$;