import { authFetch } from "@/lib/authFetch";
import type { SchoolData } from "../supabase/schools";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const backendSchoolsApi = {
  /**
   * Get school data by ID
   */
  async getSchool(schoolId: string): Promise<{ school: SchoolData }> {
    const response = await authFetch(`${API_BASE_URL}/schools/${schoolId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch school data (${response.status})`);
    }

    return response.json();
  },

  /**
   * Get card fields configuration for a school
   */
  async getCardFields(schoolId: string): Promise<unknown> {
    const response = await authFetch(
      `${API_BASE_URL}/schools/${schoolId}/card-fields`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch card fields (${response.status})`);
    }

    return response.json();
  },

  /**
   * Accept a discovered field suggestion: promotes it into card_fields and
   * removes it from suggested_card_fields. Returns the updated lists.
   */
  async acceptSuggestedField(
    schoolId: string,
    key: string
  ): Promise<{ card_fields: SchoolData["card_fields"]; suggested_card_fields: SchoolData["suggested_card_fields"] }> {
    const response = await authFetch(
      `${API_BASE_URL}/schools/${schoolId}/suggested-fields/accept`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to accept suggested field (${response.status})`);
    }

    return response.json();
  },

  /**
   * Dismiss a discovered field suggestion: removes it from suggested_card_fields.
   */
  async dismissSuggestedField(
    schoolId: string,
    key: string
  ): Promise<{ suggested_card_fields: SchoolData["suggested_card_fields"] }> {
    const response = await authFetch(
      `${API_BASE_URL}/schools/${schoolId}/suggested-fields/dismiss`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to dismiss suggested field (${response.status})`);
    }

    return response.json();
  },
};
