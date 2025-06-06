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
};
