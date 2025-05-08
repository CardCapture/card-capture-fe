-- Add missing foreign key constraints for school_id to schools(id) and set up RLS and policies

-- ========== Add missing foreign key constraints ==========

-- Helper: Add FK if not present for each table
DO $$
BEGIN
  -- extracted_data
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'extracted_data' AND column_name = 'school_id' AND data_type = 'uuid') AND
     NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'extracted_data' AND constraint_type = 'FOREIGN KEY' AND constraint_name = 'fk_extracted_data_school_id') THEN
    ALTER TABLE extracted_data ADD CONSTRAINT fk_extracted_data_school_id FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;
  END IF;

  -- reviewed_data
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviewed_data' AND column_name = 'school_id' AND data_type = 'uuid') AND
     NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'reviewed_data' AND constraint_type = 'FOREIGN KEY' AND constraint_name = 'fk_reviewed_data_school_id') THEN
    ALTER TABLE reviewed_data ADD CONSTRAINT fk_reviewed_data_school_id FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;
  END IF;

  -- events
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'school_id' AND data_type = 'uuid') AND
     NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'events' AND constraint_type = 'FOREIGN KEY' AND constraint_name = 'fk_events_school_id') THEN
    ALTER TABLE events ADD CONSTRAINT fk_events_school_id FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;
  END IF;

  -- processing_jobs
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'processing_jobs' AND column_name = 'school_id' AND data_type = 'uuid') AND
     NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'processing_jobs' AND constraint_type = 'FOREIGN KEY' AND constraint_name = 'fk_processing_jobs_school_id') THEN
    ALTER TABLE processing_jobs ADD CONSTRAINT fk_processing_jobs_school_id FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;
  END IF;

  -- card_actions
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'card_actions' AND column_name = 'school_id' AND data_type = 'uuid') AND
     NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'card_actions' AND constraint_type = 'FOREIGN KEY' AND constraint_name = 'fk_card_actions_school_id') THEN
    ALTER TABLE card_actions ADD CONSTRAINT fk_card_actions_school_id FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;
  END IF;

  -- cards
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cards' AND column_name = 'school_id' AND data_type = 'uuid') AND
     NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'cards' AND constraint_type = 'FOREIGN KEY' AND constraint_name = 'fk_cards_school_id') THEN
    ALTER TABLE cards ADD CONSTRAINT fk_cards_school_id FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;
  END IF;

  -- user_actions
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_actions' AND column_name = 'school_id' AND data_type = 'uuid') AND
     NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'user_actions' AND constraint_type = 'FOREIGN KEY' AND constraint_name = 'fk_user_actions_school_id') THEN
    ALTER TABLE user_actions ADD CONSTRAINT fk_user_actions_school_id FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- ========== Enable RLS and add policies ==========

-- Helper: For each table, enable RLS and add policies for SELECT/INSERT/UPDATE (school_id match), DELETE (admin only)
DO $$
DECLARE
  tbl TEXT;
  policy_select TEXT;
  policy_insert TEXT;
  policy_update TEXT;
  policy_delete TEXT;
  school_id_expr TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['extracted_data','reviewed_data','events','processing_jobs','card_actions','cards','user_actions']
  LOOP
    -- Use a cast for processing_jobs, else use plain school_id
    IF tbl = 'processing_jobs' THEN
      school_id_expr := 'school_id::uuid';
    ELSE
      school_id_expr := 'school_id';
    END IF;

    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS school_select ON %I;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS school_insert ON %I;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS school_update ON %I;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS admin_delete ON %I;', tbl);

    policy_select := format('CREATE POLICY school_select ON %I FOR SELECT USING (%s IN (SELECT school_id FROM profiles WHERE id = auth.uid()));', tbl, school_id_expr);
    policy_insert := format('CREATE POLICY school_insert ON %I FOR INSERT WITH CHECK (%s IN (SELECT school_id FROM profiles WHERE id = auth.uid()));', tbl, school_id_expr);
    policy_update := format('CREATE POLICY school_update ON %I FOR UPDATE USING (%s IN (SELECT school_id FROM profiles WHERE id = auth.uid())) WITH CHECK (%s IN (SELECT school_id FROM profiles WHERE id = auth.uid()));', tbl, school_id_expr, school_id_expr);
    policy_delete := format('CREATE POLICY admin_delete ON %I FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin''));', tbl);

    EXECUTE policy_select;
    EXECUTE policy_insert;
    EXECUTE policy_update;
    EXECUTE policy_delete;
  END LOOP;
END $$; 