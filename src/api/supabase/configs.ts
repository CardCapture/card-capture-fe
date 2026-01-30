import { supabase } from "@/lib/supabaseClient";
import { logger } from '@/utils/logger';

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
      .maybeSingle(); // Use maybeSingle instead of single to handle 0 or 1 rows gracefully

    if (error) {
      logger.error("Error fetching SFTP config:", error);
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
