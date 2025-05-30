// Define all possible status strings returned by the backend's 'review_status'
export type CardStatus =
  | "reviewed"
  | "needs_human_review"
  | "exported"
  | "archived"
  | "processing";

// Interface for the nested detail object for each field
export interface FieldDetail {
  value: string;
  reviewed: boolean;
  requires_human_review: boolean;
  source: string;
  review_notes: string;
  actual_field_name: string;
}

// Updated ProspectCard interface
export interface ProspectCard {
  id: string;
  document_id: string;
  review_status: string;
  fields: Record<string, FieldData>;
  created_at: string;
  reviewed_at?: string;
  exported_at?: string;
  event_id?: string;
  updated_at: string;
  school_id: string;
  user_id?: string;
  image_path?: string;
  trimmed_image_path?: string;
}

// ScannerResult remains the same
export interface ScannerResult {
  success: boolean;
  data?: Partial<Record<keyof ProspectCard["fields"], string>>;
  missingFields?: string[];
  errorMessage?: string;
}

export interface FieldData {
  value: string;
  required: boolean;
  enabled: boolean;
  review_confidence: number;
  requires_human_review: boolean;
  review_notes: string;
  confidence: number;
  bounding_box: number[][];
  reviewed?: boolean;
  source?: string;
  actual_field_name?: string;
}
