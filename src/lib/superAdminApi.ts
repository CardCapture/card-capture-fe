import { supabase } from "./supabaseClient";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Types
export interface School {
  id: string;
  name: string;
  docai_processor_id: string | null;
  created_at: string;
  user_count: number;
}

export interface SchoolCreate {
  name: string;
  docai_processor_id?: string;
}

export interface SuperAdminResponse {
  is_superadmin: boolean;
  user_id: string;
}

export interface SchoolCreateResponse {
  message: string;
  school: {
    id: string;
    name: string;
    docai_processor_id: string | null;
    created_at: string;
  };
}

export interface InviteAdminResponse {
  message: string;
  school_name: string;
  result: {
    // Result from invite_user_controller - can be extended as needed
    [key: string]: unknown;
  };
}

export interface TimeSeriesDataPoint {
  date: string;
  count: number;
}

export interface SchoolStats {
  school_id: string;
  school_name: string;
  students: number;
  events: number;
  cards: number;
  users: number;
}

export interface PlatformStats {
  total_students: number;
  total_schools: number;
  total_events: number;
  total_cards: number;
  total_users: number;
  students_over_time: TimeSeriesDataPoint[];
  events_over_time: TimeSeriesDataPoint[];
  cards_over_time: TimeSeriesDataPoint[];
  schools_breakdown: SchoolStats[];
}

// Helper function to get auth headers
async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  if (!token) {
    throw new Error("No authentication token available");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `HTTP error! status: ${response.status}`
    );
  }
  return response.json();
}

// SuperAdmin API functions
export const superAdminApi = {
  // Check if current user is SuperAdmin
  async checkSuperAdminStatus(): Promise<SuperAdminResponse> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/superadmin/check`, {
      method: "GET",
      headers,
    });
    return handleResponse<SuperAdminResponse>(response);
  },

  // Get all schools with user counts
  async getSchools(): Promise<School[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/superadmin/schools`, {
      method: "GET",
      headers,
    });
    return handleResponse<School[]>(response);
  },

  // Create a new school
  async createSchool(schoolData: SchoolCreate): Promise<SchoolCreateResponse> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/superadmin/schools`, {
      method: "POST",
      headers,
      body: JSON.stringify(schoolData),
    });
    return handleResponse<SchoolCreateResponse>(response);
  },

  // Invite admin to specific school
  async inviteAdmin(
    schoolId: string,
    inviteData: {
      email: string;
      first_name?: string;
      last_name?: string;
    }
  ): Promise<InviteAdminResponse> {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/superadmin/schools/${schoolId}/invite-admin`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...inviteData,
          school_id: schoolId,
        }),
      }
    );
    return handleResponse<InviteAdminResponse>(response);
  },

  // Get platform-wide statistics
  async getStats(): Promise<PlatformStats> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/superadmin/stats`, {
      method: "GET",
      headers,
    });
    return handleResponse<PlatformStats>(response);
  },
};

export default superAdminApi;
