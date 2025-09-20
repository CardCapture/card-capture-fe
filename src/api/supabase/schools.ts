import { supabase } from "@/lib/supabaseClient";

export interface SchoolData {
  id: string;
  name: string;
  email: string;
  stripe_customer_id: string | null;
  created_at: string;
  enable_signup_sheets?: boolean; // Feature flag for signup sheet functionality
  enable_qr_scanning?: boolean; // Feature flag for QR code scanning functionality
  card_fields?:
    | Array<{
        key: string;
        enabled: boolean;
        required: boolean;
        field_type?: 'text' | 'select' | 'checkbox' | 'email' | 'phone' | 'date';
        label?: string;
        options?: string[];
        placeholder?: string;
      }>
    | Record<string, { 
        enabled: boolean; 
        required: boolean;
        field_type?: 'text' | 'select' | 'checkbox' | 'email' | 'phone' | 'date';
        label?: string;
        options?: string[];
        placeholder?: string;
      }>;
  majors?: string[];
}

export const schoolsApi = {
  /**
   * Get school by ID
   */
  async getSchool(schoolId: string): Promise<SchoolData> {
    const { data, error } = await supabase
      .from("schools")
      .select("*")
      .eq("id", schoolId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch school: ${error.message}`);
    }

    if (!data) {
      throw new Error("School not found");
    }

    return data;
  },

  /**
   * Get school card fields configuration
   */
  async getCardFields(schoolId: string): Promise<SchoolData["card_fields"]> {
    const { data, error } = await supabase
      .from("schools")
      .select("card_fields")
      .eq("id", schoolId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch card fields: ${error.message}`);
    }

    return data?.card_fields;
  },

  /**
   * Get school majors list
   */
  async getMajors(schoolId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from("schools")
      .select("majors")
      .eq("id", schoolId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch majors: ${error.message}`);
    }

    return data?.majors || [];
  },

  /**
   * Update school data
   */
  async updateSchool(
    schoolId: string,
    updates: Partial<Omit<SchoolData, "id" | "created_at">>
  ): Promise<SchoolData> {
    const { data, error } = await supabase
      .from("schools")
      .update(updates)
      .eq("id", schoolId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update school: ${error.message}`);
    }

    return data;
  },

  /**
   * Update card fields configuration
   */
  async updateCardFields(
    schoolId: string,
    cardFields: SchoolData["card_fields"]
  ): Promise<void> {
    const { error } = await supabase
      .from("schools")
      .update({ card_fields: cardFields })
      .eq("id", schoolId);

    if (error) {
      throw new Error(`Failed to update card fields: ${error.message}`);
    }
  },

  /**
   * Update majors list
   */
  async updateMajors(schoolId: string, majors: string[]): Promise<void> {
    const { error } = await supabase
      .from("schools")
      .update({ majors })
      .eq("id", schoolId);

    if (error) {
      throw new Error(`Failed to update majors: ${error.message}`);
    }
  },
};
