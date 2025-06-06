import { authFetch } from "@/lib/authFetch";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  last_sign_in_at?: string | null;
  school_id?: string;
}

export const usersApi = {
  /**
   * Get all users
   */
  async getUsers(token?: string): Promise<UserProfile[]> {
    const response = await authFetch(`${API_BASE_URL}/users`, {}, token);

    if (!response.ok) {
      throw new Error(`Failed to fetch users (${response.status})`);
    }

    const data = await response.json();
    return data || [];
  },

  /**
   * Update user
   */
  async updateUser(
    userId: string,
    updates: Partial<UserProfile>,
    token?: string
  ): Promise<UserProfile> {
    const response = await authFetch(
      `${API_BASE_URL}/users/${userId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      },
      token
    );

    if (!response.ok) {
      throw new Error(`Failed to update user (${response.status})`);
    }

    return response.json();
  },

  /**
   * Delete user
   */
  async deleteUser(userId: string, token?: string): Promise<void> {
    const response = await authFetch(
      `${API_BASE_URL}/users/${userId}`,
      {
        method: "DELETE",
      },
      token
    );

    if (!response.ok) {
      throw new Error(`Failed to delete user (${response.status})`);
    }
  },

  /**
   * Invite user
   */
  async inviteUser(
    inviteData: {
      email: string;
      first_name: string;
      last_name: string;
      role: string[];
      school_id: string;
    },
    token?: string
  ): Promise<void> {
    const response = await authFetch(
      `${API_BASE_URL}/invite-user`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inviteData),
      },
      token
    );

    if (!response.ok) {
      throw new Error(`Failed to invite user (${response.status})`);
    }
  },
};
