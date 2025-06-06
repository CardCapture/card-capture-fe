import { integrationsApi } from "@/api/backend/integrations";
import { SchoolService } from "./SchoolService";
import type { SFTPConfig } from "@/api/supabase/configs";

export class IntegrationsService {
  /**
   * Get SFTP configuration for a school
   */
  static async getSftpConfig(schoolId: string): Promise<SFTPConfig | null> {
    try {
      return await SchoolService.getSftpConfig(schoolId);
    } catch (error) {
      console.error("IntegrationsService: Failed to get SFTP config", error);
      throw error;
    }
  }

  /**
   * Save SFTP configuration
   */
  static async saveSftpConfig(
    config: SFTPConfig,
    token?: string
  ): Promise<void> {
    try {
      // Validate config before saving
      const validation = this.validateSftpConfig(config);
      if (!validation.isValid) {
        throw new Error(
          `Invalid SFTP configuration: ${validation.errors.join(", ")}`
        );
      }

      await integrationsApi.saveSftpConfig(config, token);
    } catch (error) {
      console.error("IntegrationsService: Failed to save SFTP config", error);
      throw error;
    }
  }

  /**
   * Test SFTP connection
   */
  static async testSftpConnection(
    config: SFTPConfig,
    token?: string
  ): Promise<void> {
    try {
      // Validate config before testing
      const validation = this.validateSftpConfig(config);
      if (!validation.isValid) {
        throw new Error(
          `Invalid SFTP configuration: ${validation.errors.join(", ")}`
        );
      }

      await integrationsApi.testSftpConnection(config, token);
    } catch (error) {
      console.error(
        "IntegrationsService: Failed to test SFTP connection",
        error
      );
      throw error;
    }
  }

  /**
   * Test general API connection
   */
  static async testConnection(): Promise<void> {
    try {
      await integrationsApi.testConnection();
    } catch (error) {
      console.error("IntegrationsService: Failed to test connection", error);
      throw error;
    }
  }

  /**
   * Create Stripe billing portal session
   */
  static async createStripePortalSession(token?: string): Promise<string> {
    try {
      const response = await integrationsApi.createStripePortalSession(token);
      return response.url;
    } catch (error) {
      console.error(
        "IntegrationsService: Failed to create Stripe portal session",
        error
      );
      throw error;
    }
  }

  /**
   * Validate SFTP configuration
   */
  static validateSftpConfig(config: SFTPConfig): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!config.host || config.host.trim().length === 0) {
      errors.push("Host is required");
    }

    if (!config.username || config.username.trim().length === 0) {
      errors.push("Username is required");
    }

    if (!config.password || config.password.trim().length === 0) {
      errors.push("Password is required");
    }

    if (!config.upload_path || config.upload_path.trim().length === 0) {
      errors.push("Upload path is required");
    } else if (!config.upload_path.startsWith("/")) {
      errors.push("Upload path must start with /");
    }

    // Validate host format (basic check)
    if (config.host && !/^[a-zA-Z0-9.-]+$/.test(config.host)) {
      errors.push("Invalid host format");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get default SFTP configuration
   */
  static getDefaultSftpConfig(): SFTPConfig {
    return {
      host: "",
      username: "",
      password: "",
      upload_path: "/",
    };
  }

  /**
   * Mask sensitive SFTP data for logging
   */
  static maskSftpConfigForLogging(config: SFTPConfig) {
    return {
      host: config.host,
      username: config.username,
      password: "***MASKED***",
      upload_path: config.upload_path,
    };
  }
}
