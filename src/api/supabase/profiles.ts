import { supabase } from "@/lib/supabaseClient";

export interface ProfileData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  school_id: string;
  role: string | string[];
  last_sign_in_at?: string | null;
}

export const profilesApi = {
  /**
   * Get profile by user ID
   */
  async getProfile(userId: string): Promise<ProfileData> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch profile: ${error.message}`);
    }

    if (!data) {
      throw new Error("Profile not found");
    }

    return data;
  },

  /**
   * Get school_id for a user
   */
  async getSchoolId(userId: string): Promise<string> {
    const { data, error } = await supabase
      .from("profiles")
      .select("school_id")
      .eq("id", userId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch profile school_id: ${error.message}`);
    }

    if (!data?.school_id) {
      throw new Error("No school ID found in profile");
    }

    return data.school_id;
  },

  /**
   * Update profile data
   */
  async updateProfile(
    userId: string,
    updates: Partial<Omit<ProfileData, "id">>
  ): Promise<ProfileData> {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    return data;
  },
};
