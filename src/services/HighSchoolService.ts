import { authFetch } from "@/lib/authFetch";
import { logger } from '@/utils/logger';

export interface HighSchool {
  id: string;
  name: string;
  city: string;
  state: string;
  ceeb_code?: string;
  phone?: string;
  website?: string;
  district_name?: string;
  school_type?: string;
  level?: string;
  source?: string;
  match_score?: number;
}

export interface HighSchoolSearchResponse {
  query: string;
  results: HighSchool[];
  count: number;
}

export class HighSchoolService {
  private static baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  static async searchHighSchools(
    query: string,
    limit: number = 10,
    state?: string
  ): Promise<HighSchoolSearchResponse> {
    try {
      const params = new URLSearchParams({
        q: query,
        limit: limit.toString(),
      });
      
      if (state) {
        params.append("state", state);
      }

      const response = await authFetch(
        `${this.baseUrl}/high_schools/search?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Failed to search high schools: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error("Error searching high schools:", error);
      throw error;
    }
  }

  static async getHighSchoolById(schoolId: string): Promise<{ school: HighSchool }> {
    try {
      const response = await authFetch(
        `${this.baseUrl}/high_schools/${schoolId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to get high school: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error("Error getting high school:", error);
      throw error;
    }
  }

  static async getHighSchoolsByState(
    state: string,
    limit: number = 100
  ): Promise<{ state: string; schools: HighSchool[]; count: number }> {
    try {
      const response = await authFetch(
        `${this.baseUrl}/high_schools/state/${state}?limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`Failed to get schools by state: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error("Error getting schools by state:", error);
      throw error;
    }
  }
}