import { usersApi, type UserProfile } from "@/api/backend/users";

export interface UserToEdit {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: ("admin" | "recruiter" | "reviewer")[];
}

export class UserService {
  /**
   * Get all users for a school
   */
  static async getAllUsers(token?: string): Promise<UserProfile[]> {
    try {
      return await usersApi.getUsers(token);
    } catch (error) {
      console.error("UserService: Failed to get users", error);
      throw error;
    }
  }

  /**
   * Update user information
   */
  static async updateUser(
    userId: string,
    updates: Partial<UserProfile>,
    token?: string
  ): Promise<UserProfile> {
    try {
      return await usersApi.updateUser(userId, updates, token);
    } catch (error) {
      console.error("UserService: Failed to update user", error);
      throw error;
    }
  }

  /**
   * Delete a user
   */
  static async deleteUser(userId: string, token?: string): Promise<void> {
    try {
      await usersApi.deleteUser(userId, token);
    } catch (error) {
      console.error("UserService: Failed to delete user", error);
      throw error;
    }
  }

  /**
   * Invite a new user
   */
  static async inviteUser(
    inviteData: {
      email: string;
      first_name: string;
      last_name: string;
      role: string[];
    },
    token?: string
  ): Promise<void> {
    try {
      await usersApi.inviteUser(inviteData, token);
    } catch (error) {
      console.error("UserService: Failed to invite user", error);
      throw error;
    }
  }

  /**
   * Transform UserProfile to UserToEdit format
   */
  static transformToEditFormat(user: UserProfile): UserToEdit {
    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: Array.isArray(user.role)
        ? (user.role as ("admin" | "recruiter" | "reviewer")[])
        : [user.role as "admin" | "recruiter" | "reviewer"],
    };
  }

  /**
   * Format user for display
   */
  static formatUserForDisplay(user: UserProfile) {
    return {
      ...user,
      fullName: `${user.first_name} ${user.last_name}`,
      roleDisplay: Array.isArray(user.role) ? user.role.join(", ") : user.role,
      lastSignInFormatted: user.last_sign_in_at
        ? new Date(user.last_sign_in_at).toLocaleDateString(undefined, {
            month: "short",
            day: "2-digit",
            year: "numeric",
          })
        : "-",
    };
  }

  /**
   * Validate user data before operations
   */
  static validateUserData(userData: {
    email: string;
    first_name: string;
    last_name: string;
    role: string[];
  }) {
    const errors: string[] = [];

    if (!userData.email || userData.email.trim().length === 0) {
      errors.push("Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.push("Invalid email format");
    }

    if (!userData.first_name || userData.first_name.trim().length === 0) {
      errors.push("First name is required");
    }

    if (!userData.last_name || userData.last_name.trim().length === 0) {
      errors.push("Last name is required");
    }

    if (
      !userData.role ||
      !Array.isArray(userData.role) ||
      userData.role.length === 0
    ) {
      errors.push("At least one role is required");
    } else {
      const validRoles = ["admin", "recruiter", "reviewer"];
      const invalidRoles = userData.role.filter(
        (role) => !validRoles.includes(role)
      );
      if (invalidRoles.length > 0) {
        errors.push(`Invalid roles: ${invalidRoles.join(", ")}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
