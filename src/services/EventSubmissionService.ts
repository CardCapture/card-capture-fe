/**
 * Service for submitting events to the universal events catalog.
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export interface EventSubmissionData {
  name: string;
  event_date: string; // YYYY-MM-DD format
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  start_time?: string; // HH:MM format
  end_time?: string;
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  description?: string;
  needs_inquiry_cards?: boolean;
  expected_students?: number;
}

export interface EventSubmissionResponse {
  success: boolean;
  event_id: string;
  message: string;
}

export async function submitEvent(
  data: EventSubmissionData
): Promise<EventSubmissionResponse> {
  const response = await fetch(`${API_BASE_URL}/public/universal-events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to submit event");
  }

  return response.json();
}
