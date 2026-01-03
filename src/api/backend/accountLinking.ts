import { authFetch } from "@/lib/authFetch";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export interface LinkRequestRequester {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface LinkRequestEvent {
  id: string;
  name: string;
  event_date: string;
  location?: string;
  city?: string;
}

export interface LinkRequestPurchase {
  id: string;
  amount: number;
  status: string;
  completed_at?: string;
}

export interface PurchasedEvent {
  event: LinkRequestEvent;
  purchase: LinkRequestPurchase;
}

export interface LinkRequest {
  id: string;
  requester_user_id: string;
  target_school_id: string;
  universal_event_id: string;
  status: "pending" | "approved" | "rejected" | "expired" | "cancelled";
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  admin_notes?: string;
  expires_at?: string;
  requester?: LinkRequestRequester;
  universal_event?: LinkRequestEvent;
  event_purchase?: LinkRequestPurchase;
  target_school?: { id: string; name: string };
  reviewer?: LinkRequestRequester;
  // All events purchased by the requester
  purchased_events?: PurchasedEvent[];
  total_amount?: number;
}

export interface LinkRequestsResponse {
  requests: LinkRequest[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface PendingCountResponse {
  count: number;
}

export const accountLinkingApi = {
  /**
   * Get all link requests for the current user's school
   */
  async getLinkRequests(
    options: {
      status?: string;
      page?: number;
      limit?: number;
    } = {},
    token?: string
  ): Promise<LinkRequestsResponse> {
    const params = new URLSearchParams();
    if (options.status) params.append("status", options.status);
    if (options.page) params.append("page", String(options.page));
    if (options.limit) params.append("limit", String(options.limit));

    const queryString = params.toString();
    const url = `${API_BASE_URL}/account-link-requests${queryString ? `?${queryString}` : ""}`;

    const response = await authFetch(url, {}, token);

    if (!response.ok) {
      throw new Error(`Failed to fetch link requests (${response.status})`);
    }

    return response.json();
  },

  /**
   * Get count of pending link requests
   */
  async getPendingCount(token?: string): Promise<PendingCountResponse> {
    const response = await authFetch(
      `${API_BASE_URL}/account-link-requests/pending/count`,
      {},
      token
    );

    if (!response.ok) {
      // Don't throw - just return 0 for non-admins
      return { count: 0 };
    }

    return response.json();
  },

  /**
   * Get a specific link request by ID
   */
  async getLinkRequest(requestId: string, token?: string): Promise<LinkRequest> {
    const response = await authFetch(
      `${API_BASE_URL}/account-link-requests/${requestId}`,
      {},
      token
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch link request (${response.status})`);
    }

    return response.json();
  },

  /**
   * Approve a link request
   */
  async approveLinkRequest(
    requestId: string,
    adminNotes?: string,
    token?: string
  ): Promise<{ success: boolean; message: string; request_id: string }> {
    const response = await authFetch(
      `${API_BASE_URL}/account-link-requests/${requestId}/approve`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ admin_notes: adminNotes }),
      },
      token
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Failed to approve link request (${response.status})`
      );
    }

    return response.json();
  },

  /**
   * Reject a link request
   */
  async rejectLinkRequest(
    requestId: string,
    adminNotes?: string,
    token?: string
  ): Promise<{ success: boolean; message: string; request_id: string }> {
    const response = await authFetch(
      `${API_BASE_URL}/account-link-requests/${requestId}/reject`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ admin_notes: adminNotes }),
      },
      token
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Failed to reject link request (${response.status})`
      );
    }

    return response.json();
  },
};
