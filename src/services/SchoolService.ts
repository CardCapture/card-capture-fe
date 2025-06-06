import { schoolsApi, type SchoolData } from "@/api/supabase/schools";
import { backendSchoolsApi } from "@/api/backend/schools";
import { configsApi, type SFTPConfig } from "@/api/supabase/configs";

export interface CardField {
  key: string;
  label: string;
  visible: boolean;
  required: boolean;
}

export class SchoolService {
  /**
   * Get complete school data (combines backend and supabase data)
   */
  static async getSchoolData(schoolId: string): Promise<SchoolData> {
    try {
      // Prefer backend API for complete school data
      const response = await backendSchoolsApi.getSchool(schoolId);
      return response.school;
    } catch (error) {
      console.warn("SchoolService: Backend API failed, trying Supabase", error);
      // Fallback to Supabase
      return await schoolsApi.getSchool(schoolId);
    }
  }

  /**
   * Get card fields configuration
   */
  static async getCardFields(
    schoolId: string
  ): Promise<SchoolData["card_fields"]> {
    try {
      return await schoolsApi.getCardFields(schoolId);
    } catch (error) {
      console.error("SchoolService: Failed to get card fields", error);
      throw error;
    }
  }

  /**
   * Get majors list
   */
  static async getMajors(schoolId: string): Promise<string[]> {
    try {
      return await schoolsApi.getMajors(schoolId);
    } catch (error) {
      console.error("SchoolService: Failed to get majors", error);
      throw error;
    }
  }

  /**
   * Update school data
   */
  static async updateSchool(
    schoolId: string,
    updates: Partial<Omit<SchoolData, "id" | "created_at">>
  ): Promise<SchoolData> {
    try {
      return await schoolsApi.updateSchool(schoolId, updates);
    } catch (error) {
      console.error("SchoolService: Failed to update school", error);
      throw error;
    }
  }

  /**
   * Update card fields configuration with validation
   */
  static async updateCardFields(
    schoolId: string,
    fields: CardField[]
  ): Promise<void> {
    try {
      // Transform UI format to database format
      const cardFields = fields.map((field) => ({
        key: field.key,
        enabled: field.visible,
        required: field.required,
      }));

      await schoolsApi.updateCardFields(schoolId, cardFields);
    } catch (error) {
      console.error("SchoolService: Failed to update card fields", error);
      throw error;
    }
  }

  /**
   * Update majors list with validation
   */
  static async updateMajors(schoolId: string, majors: string[]): Promise<void> {
    try {
      // Clean and validate majors
      const cleanMajors = majors
        .map((major) => major.trim())
        .filter((major) => major.length > 0);

      await schoolsApi.updateMajors(schoolId, cleanMajors);
    } catch (error) {
      console.error("SchoolService: Failed to update majors", error);
      throw error;
    }
  }

  /**
   * Get SFTP configuration
   */
  static async getSftpConfig(schoolId: string): Promise<SFTPConfig | null> {
    try {
      return await configsApi.getSftpConfig(schoolId);
    } catch (error) {
      console.error("SchoolService: Failed to get SFTP config", error);
      throw error;
    }
  }

  /**
   * Transform card fields from database format to UI format
   */
  static transformCardFieldsForUI(
    cardFields: SchoolData["card_fields"]
  ): CardField[] {
    if (!cardFields) return [];

    // Handle both array and object formats for backward compatibility
    if (Array.isArray(cardFields)) {
      return cardFields.map((field) => ({
        key: field.key,
        label: field.key
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
        visible: field.enabled,
        required: field.required,
      }));
    } else if (typeof cardFields === "object") {
      return Object.entries(cardFields).map(([key, config]) => ({
        key,
        label: key
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
        visible: config.enabled,
        required: config.required,
      }));
    }

    return [];
  }

  /**
   * Extract card fields as array format
   */
  static extractCardFieldsArray(
    school: SchoolData
  ): Array<{ key: string; enabled: boolean; required: boolean }> {
    if (!school?.card_fields) return [];

    if (Array.isArray(school.card_fields)) {
      return school.card_fields;
    } else if (typeof school.card_fields === "object") {
      return Object.entries(school.card_fields).map(([key, config]) => ({
        key,
        enabled: config.enabled || false,
        required: config.required || false,
      }));
    }

    return [];
  }
}
