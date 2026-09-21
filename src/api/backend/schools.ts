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
   * Update the card fields configuration for a school.
   *
   * This must go through the backend rather than writing to Supabase directly:
   * RLS on `schools` only permits UPDATE for users without a school_id, so a
   * direct write from a school admin is rejected and PostgREST reports success
   * with zero rows changed. The backend uses the service role and checks that
   * the caller belongs to the school it is updating.
   */
  async updateCardFields(
    schoolId: string,
    cardFields: SchoolData["card_fields"]
  ): Promise<{ card_fields: SchoolData["card_fields"] }> {
    const response = await authFetch(
      `${API_BASE_URL}/schools/${schoolId}/card-fields`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card_fields: cardFields }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error || `Failed to update card fields (${response.status})`
      );
    }

    return response.json();
  },

  /**
   * Update the majors list for a school.
   *
   * Goes through the backend for the same reason as updateCardFields: a direct
   * Supabase write is rejected by RLS and reports success anyway.
   */
  async updateMajors(schoolId: string, majors: string[]): Promise<{ majors: string[] }> {
    const response = await authFetch(`${API_BASE_URL}/schools/${schoolId}/majors`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ majors }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error || `Failed to update majors (${response.status})`
      );
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
