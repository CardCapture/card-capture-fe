/**
 * Service for recruiter self-service signup API calls.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface School {
  id: string;
  name: string;
  city?: string;
  state?: string;
}

export interface UniversalEvent {
  id: string;
  name: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  city?: string;
  state?: string;
  venue?: string;
  description?: string;
}

export interface SchoolsResponse {
  schools: School[];
  total: number;
}

export interface EventsSearchResponse {
  events: UniversalEvent[];
  total: number;
  page: number;
  pages: number;
}

export interface RecruiterSignupRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  school_selection: {
    type: 'existing' | 'new';
    school_id?: string;
    school_name?: string;
  };
  universal_event_id: string;
}

export interface RecruiterSignupResponse {
  user_id: string;
  checkout_session_id: string;
  checkout_url: string;
  access_token: string;
  refresh_token: string;
}

export interface CreateAccountRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  school_selection: {
    type: 'existing' | 'new';
    school_id?: string;
    school_name?: string;
  };
}

export interface CreateAccountResponse {
  user_id: string;
  school_id: string;
}

export interface PaymentVerificationResponse {
  status: 'completed' | 'pending' | 'failed';
  event_id: string | null;
  message: string;
}

class RecruiterSignupService {
  /**
   * Get list of schools for dropdown.
   */
  async getSchools(query?: string, limit: number = 100): Promise<SchoolsResponse> {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    params.append('limit', limit.toString());

    const response = await fetch(`${API_BASE_URL}/public/schools?${params}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch schools');
    }
    return response.json();
  }

  /**
   * Search universal events with filters.
   */
  async searchEvents(params: {
    query?: string;
    state?: string;
    dateFrom?: string;
    dateTo?: string;
    city?: string;
    page?: number;
    limit?: number;
  }): Promise<EventsSearchResponse> {
    const searchParams = new URLSearchParams();
    if (params.query) searchParams.append('q', params.query);
    if (params.state) searchParams.append('state', params.state);
    if (params.dateFrom) searchParams.append('date_from', params.dateFrom);
    if (params.dateTo) searchParams.append('date_to', params.dateTo);
    if (params.city) searchParams.append('city', params.city);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const response = await fetch(`${API_BASE_URL}/public/universal-events/search?${searchParams}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to search events');
    }
    return response.json();
  }

  /**
   * Get a single event by ID.
   */
  async getEvent(eventId: string): Promise<{ event: UniversalEvent }> {
    const response = await fetch(`${API_BASE_URL}/public/universal-events/${eventId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch event');
    }
    return response.json();
  }

  /**
   * Complete recruiter signup with event purchase.
   * Creates account and returns Stripe checkout URL.
   */
  async signup(request: RecruiterSignupRequest): Promise<RecruiterSignupResponse> {
    const response = await fetch(`${API_BASE_URL}/public/recruiter-signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Signup failed');
    }
    return response.json();
  }

  /**
   * Create account without event purchase (for two-step flow).
   * User will select event after account creation.
   */
  async createAccount(request: CreateAccountRequest): Promise<CreateAccountResponse> {
    const response = await fetch(`${API_BASE_URL}/public/recruiter-create-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Account creation failed');
    }
    return response.json();
  }

  /**
   * Verify payment status and get created event ID.
   */
  async verifyPayment(sessionId: string): Promise<PaymentVerificationResponse> {
    const response = await fetch(`${API_BASE_URL}/public/verify-payment/${sessionId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to verify payment');
    }
    return response.json();
  }
}

export const recruiterSignupService = new RecruiterSignupService();
export default recruiterSignupService;
