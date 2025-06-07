import { supabase } from "@/lib/supabaseClient";

export interface SFTPConfig {
  school_id: string;
  host: string;
  username: string;
  password: string;
  remote_path: string;
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
      remote_path: data.remote_path || "",
      school_id: data.school_id || "",
    };
  },
};
