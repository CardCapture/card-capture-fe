import { profilesApi, type ProfileData } from "@/api/supabase/profiles";

export class ProfileService {
  /**
   * Get user profile with error handling and transformation
   */
  static async getProfile(userId: string): Promise<ProfileData> {
    try {
      return await profilesApi.getProfile(userId);
    } catch (error) {
      console.error("ProfileService: Failed to get profile", error);
      throw error;
    }
  }

  /**
   * Get school ID for a user
   */
  static async getSchoolId(userId: string): Promise<string> {
    try {
      return await profilesApi.getSchoolId(userId);
    } catch (error) {
      console.error("ProfileService: Failed to get school ID", error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    updates: Partial<Omit<ProfileData, "id">>
  ): Promise<ProfileData> {
    try {
      return await profilesApi.updateProfile(userId, updates);
    } catch (error) {
      console.error("ProfileService: Failed to update profile", error);
      throw error;
    }
  }

  /**
   * Transform profile data for UI consumption
   */
  static transformProfileForUI(profile: ProfileData) {
    return {
      ...profile,
      fullName: `${profile.first_name} ${profile.last_name}`,
      roles: Array.isArray(profile.role) ? profile.role : [profile.role],
      lastSignInFormatted: profile.last_sign_in_at
        ? new Date(profile.last_sign_in_at).toLocaleDateString()
        : "Never",
    };
  }
}
