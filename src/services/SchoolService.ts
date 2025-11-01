import { schoolsApi, type SchoolData } from "@/api/supabase/schools";
import { backendSchoolsApi } from "@/api/backend/schools";
import { configsApi, type SFTPConfig } from "@/api/supabase/configs";
import { authFetch } from "@/lib/authFetch";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export interface CardField {
  key: string;
  label: string;
  visible: boolean;
  required: boolean;
  field_type?: 'text' | 'select' | 'checkbox' | 'email' | 'phone' | 'date';
  options?: string[];
  placeholder?: string;
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
        field_type: field.field_type || this.inferFieldType(field.key),
        label: field.label !== this.generateDefaultLabel(field.key) ? field.label : undefined, // Only store if different from default
        options: field.options && field.options.length > 0 ? field.options : undefined,
        placeholder: field.placeholder !== this.generateDefaultPlaceholder(field.key) ? field.placeholder : undefined,
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
        label: field.label || this.generateDefaultLabel(field.key),
        visible: field.enabled,
        required: field.required,
        field_type: field.field_type || this.inferFieldType(field.key),
        options: field.options || [],
        placeholder: field.placeholder || this.generateDefaultPlaceholder(field.key),
      }));
    } else if (typeof cardFields === "object") {
      return Object.entries(cardFields).map(([key, config]) => ({
        key,
        label: config.label || this.generateDefaultLabel(key),
        visible: config.enabled,
        required: config.required,
        field_type: config.field_type || this.inferFieldType(key),
        options: config.options || [],
        placeholder: config.placeholder || this.generateDefaultPlaceholder(key),
      }));
    }

    return [];
  }

  /**
   * Generate a default label for a field key
   */
  static generateDefaultLabel(fieldKey: string): string {
    // Handle special cases with better labels
    const specialLabels: Record<string, string> = {
      'cell': 'Cell',  // Changed from 'Phone Number' to canonical 'Cell'
      'date_of_birth': 'Birthday',
      'permission_to_text': 'Permission to Text',
      'zip_code': 'Zip Code',
      'high_school': 'High School',  // Simplified from 'High School/College'
      'gpa': 'GPA',
      'student_type': 'Student Type',
      'entry_term': 'Entry Term',
      'preferred_first_name': 'Preferred First Name',  // More specific than 'Preferred Name'
      'home_phone': 'Home Phone',  // Added for ACU's custom field
    };

    return specialLabels[fieldKey] || fieldKey
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Infer field type based on field key
   */
  static inferFieldType(fieldKey: string): 'text' | 'select' | 'checkbox' | 'email' | 'phone' | 'date' {
    if (fieldKey === 'email') return 'email';
    if (fieldKey === 'cell') return 'phone';
    if (fieldKey === 'date_of_birth') return 'date';
    if (fieldKey === 'permission_to_text') return 'select';
    if (fieldKey === 'student_type') return 'select';
    return 'text';
  }

  /**
   * Generate a default placeholder for a field key
   */
  static generateDefaultPlaceholder(fieldKey: string): string {
    const placeholders: Record<string, string> = {
      'name': 'Full Name',
      'preferred_first_name': 'Preferred First Name',
      'date_of_birth': 'MM/DD/YYYY',
      'email': 'Email Address',
      'cell': '(123) 456-7890',
      'home_phone': '(123) 456-7890',  // Added for ACU's custom field
      'address': '123 Main St',
      'city': 'City',
      'state': 'State',
      'zip_code': 'Zip Code',
      'high_school': 'High School',
      'gpa': 'GPA',
      'student_type': 'Student Type',
      'entry_term': 'Fall 2025',
      'major': 'Intended Major',
    };
    return placeholders[fieldKey] || this.generateDefaultLabel(fieldKey);
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

  /**
   * Get notification settings for a school
   */
  static async getNotificationSettings(schoolId: string): Promise<{
    notification_email: string | null;
    notifications_enabled: boolean;
  }> {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/schools/${schoolId}/notification-settings`
      );

      if (!response.ok) {
        throw new Error("Failed to get notification settings");
      }

      return await response.json();
    } catch (error) {
      console.error("SchoolService: Failed to get notification settings", error);
      throw error;
    }
  }

  /**
   * Update notification settings for a school
   */
  static async updateNotificationSettings(
    schoolId: string,
    settings: {
      notification_email?: string | null;
      notifications_enabled?: boolean;
    }
  ): Promise<void> {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/schools/${schoolId}/notification-settings`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(settings),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update notification settings");
      }
    } catch (error) {
      console.error("SchoolService: Failed to update notification settings", error);
      throw error;
    }
  }
}
