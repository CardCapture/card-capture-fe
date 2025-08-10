// src/services/StudentService.ts

import { authFetch } from "@/lib/authFetch";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export interface StudentRegisterPayload {
  first_name: string;
  last_name: string;
  email?: string;
  mobile?: string;
  dob?: string; // ISO or MM/DD/YYYY
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  high_school?: string;
  grade_level?: string;
  grad_year?: string;
  gpa?: number;
  gpa_scale?: number;
  sat_score?: number;
  act_score?: number;
  academic_interests?: string[];
  start_term?: string;
  start_year?: number;
  email_opt_in?: boolean;
  sms_opt_in?: boolean;
}

export const StudentService = {
  async registerStudent(payload: StudentRegisterPayload) {
    const res = await fetch(`${API_BASE_URL}/students/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Register failed (${res.status})`);
    return res.json() as Promise<{ student_id: string; token: string; qrDataUri: string }>;
  },

  async lookupByEmail(email: string) {
    const res = await fetch(`${API_BASE_URL}/students/lookup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error(`Lookup failed (${res.status})`);
    return res.json() as Promise<{ sent: boolean }>;
  },

  async scanStudent(token: string, eventId: string, rating?: number, notes?: string, authToken?: string) {
    const res = await authFetch(
      `${API_BASE_URL}/students/scan`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, event_id: eventId, rating, notes }),
      },
      authToken
    );
    if (!res.ok) throw new Error(`Scan failed (${res.status})`);
    return res.json() as Promise<{ success: boolean; document_id?: string; student_id?: string }>;
  },
};


