-- Add foreign key constraints to existing school_id columns
ALTER TABLE extracted_data
ADD CONSTRAINT fk_extracted_data_school
FOREIGN KEY (school_id)
REFERENCES schools(id)
ON DELETE RESTRICT;

ALTER TABLE reviewed_data
ADD CONSTRAINT fk_reviewed_data_school
FOREIGN KEY (school_id)
REFERENCES schools(id)
ON DELETE RESTRICT;

ALTER TABLE events
ADD CONSTRAINT fk_events_school
FOREIGN KEY (school_id)
REFERENCES schools(id)
ON DELETE RESTRICT;

ALTER TABLE processing_jobs
ADD CONSTRAINT fk_processing_jobs_school
FOREIGN KEY (school_id)
REFERENCES schools(id)
ON DELETE RESTRICT; 