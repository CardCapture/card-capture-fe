import { authFetch } from "@/lib/authFetch";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Request interface
export interface AddressSuggestionsRequest {
  address: string;
  city: string;
  state: string;
  zip_code: string;
}

// Response interfaces
export interface AddressSuggestion {
  formatted_address: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  confidence: "high" | "medium" | "low";
  source: "google_maps" | "zip_validation" | "smart_correction";
  changes_made: string[];
  enhancement_notes: string;
}

export interface AddressSuggestionsResponse {
  success: boolean;
  has_suggestions: boolean;
  suggestions: AddressSuggestion[];
  original_input: AddressSuggestionsRequest;
  validation_attempted: boolean;
  error?: string;
}

export const addressSuggestionsApi = {
  /**
   * Get address suggestions for real-time validation
   */
  async getAddressSuggestions(request: AddressSuggestionsRequest): Promise<AddressSuggestionsResponse> {
    const response = await authFetch(`${API_BASE_URL}/address-suggestions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get address suggestions (${response.status}): ${errorText}`);
    }

    return await response.json();
  },
};