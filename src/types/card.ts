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
  id: string; // Legacy field, same as document_id
  document_id: string; // Primary identifier for the card
  review_status: CardStatus; // Status from the backend
  createdAt: string; // mapped from created_at or uploaded_at
  updatedAt?: string; // mapped from reviewed_at
  deleted_at?: string | null; // When the card was deleted
  imageName?: string; // Optional: Filename if available
  image_path?: string; // Path or identifier for the image file
  exported_at: string | null; // When the card was exported
  event_id?: string | null; // ID of the associated event

  fields: Record<string, FieldDetail>;

  missingFields?: string[];
  errorMessage?: string;
}

// ScannerResult remains the same
export interface ScannerResult {
  success: boolean;
  data?: Partial<Record<keyof ProspectCard["fields"], string>>;
  missingFields?: string[];
  errorMessage?: string;
}
