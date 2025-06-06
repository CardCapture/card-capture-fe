import { authFetch } from "@/lib/authFetch";
import type { SFTPConfig } from "../supabase/configs";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const integrationsApi = {
  /**
   * Save SFTP configuration
   */
  async saveSftpConfig(config: SFTPConfig, token?: string): Promise<void> {
    const response = await authFetch(
      `${API_BASE_URL}/sftp/config`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      },
      token
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.detail || "Failed to save SFTP configuration");
    }
  },

  /**
   * Test SFTP connection
   */
  async testSftpConnection(config: SFTPConfig, token?: string): Promise<void> {
    const response = await authFetch(
      `${API_BASE_URL}/sftp/test`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      },
      token
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.detail || "Failed to test SFTP connection");
    }
  },

  /**
   * Test general connection
   */
  async testConnection(): Promise<void> {
    const response = await authFetch(`${API_BASE_URL}/test-connection`);

    if (!response.ok) {
      throw new Error(`Connection test failed (${response.status})`);
    }
  },

  /**
   * Create Stripe portal session
   */
  async createStripePortalSession(token?: string): Promise<{ url: string }> {
    const response = await authFetch(
      `${API_BASE_URL}/stripe/create-portal-session`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
      token
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.detail || "Failed to create Stripe portal session"
      );
    }

    return response.json();
  },
};
