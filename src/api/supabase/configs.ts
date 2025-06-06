import { supabase } from "@/lib/supabaseClient";

export interface SFTPConfig {
  host: string;
  username: string;
  password: string;
  upload_path: string;
}

export const configsApi = {
  /**
   * Get SFTP configuration for a school
   */
  async getSftpConfig(schoolId: string): Promise<SFTPConfig | null> {
    const { data, error } = await supabase
      .from("sftp_configs")
      .select("*")
      .eq("school_id", schoolId)
      .single();

    if (error) {
      // Return null if no config exists, don't throw error
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch SFTP config: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return {
      host: data.host || "",
      username: data.username || "",
      password: data.password || "",
      upload_path: data.upload_path || "",
    };
  },
};
