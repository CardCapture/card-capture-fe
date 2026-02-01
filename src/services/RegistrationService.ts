import { authFetch } from '@/lib/authFetch';
import { logger } from '@/utils/logger';

export interface EmailStartRequest {
  email: string;
  captcha_token?: string;
}

export interface EventCodeRequest {
  code: string;
  captcha_token?: string;
}

export interface RegistrationFormData {
  first_name: string;
  last_name: string;
  preferred_first_name?: string;
  email: string;
  cell?: string;
  email_opt_in?: boolean;
  permission_to_text?: boolean;
  address?: string;
  address_2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  date_of_birth?: string;
  high_school?: string;
  grade_level?: string;
  grad_year?: string;
  gpa?: number;
  gpa_scale?: number;
  sat_score?: number;
  act_score?: number;
  student_type?: string;
  entry_term?: string;
  entry_year?: number;
  major?: string;
  academic_interests?: string[];
}

export interface FormSession {
  session_type: 'magic_link' | 'event_code';
  email?: string;
  metadata?: any;
  existing_student?: any;  // Existing student data for pre-filling form
}

export interface RegistrationResult {
  success: boolean;
  student_id: string;
  verified: boolean;
  message: string;
  token?: string;
  qrDataUri?: string;
}

export interface EmailVerificationRequest {
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
}

class RegistrationServiceClass {
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  private sessionToken: string | null = null;

  private getSessionToken(): string | undefined {
    return this.sessionToken || sessionStorage.getItem('cc_form_session') || undefined;
  }

  private storeSessionToken(token: string) {
    this.sessionToken = token;
    sessionStorage.setItem('cc_form_session', token);
  }

  clearSessionToken() {
    this.sessionToken = null;
    sessionStorage.removeItem('cc_form_session');
  }

  /**
   * Start registration with email (magic link flow)
   */
  async startEmailRegistration(email: string): Promise<{ success: boolean; message: string; is_returning?: boolean }> {
    const response = await authFetch(`${this.baseUrl}/api/register/start-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        captcha_token: await this.getCaptchaToken()
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to start registration');
    }

    return response.json();
  }

  /**
   * Verify event code and get form access
   */
  async verifyEventCode(code: string): Promise<{ success: boolean; redirect: string; event?: any; session_token?: string }> {
    const response = await authFetch(`${this.baseUrl}/api/register/verify-event-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        captcha_token: await this.getCaptchaToken()
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to verify event code');
    }

    const data = await response.json();
    if (data.session_token) {
      this.storeSessionToken(data.session_token);
    }
    return data;
  }

  /**
   * Verify magic link token (called when user clicks email link)
   */
  async verifyMagicLink(token: string): Promise<{ success: boolean; email: string; redirect: string; session_token?: string }> {
    const response = await authFetch(`${this.baseUrl}/api/register/verify-magic-link?token=${token}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to verify magic link');
    }

    const data = await response.json();
    if (data.session_token) {
      this.storeSessionToken(data.session_token);
    }
    return data;
  }

  /**
   * Get current form session data
   */
  async getFormSession(): Promise<FormSession> {
    const response = await authFetch(`${this.baseUrl}/api/register/form-session`, {
      method: 'GET',
    }, this.getSessionToken());

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to get form session');
    }

    return response.json();
  }

  /**
   * Submit registration form
   */
  async submitRegistration(formData: RegistrationFormData): Promise<RegistrationResult> {
    const response = await authFetch(`${this.baseUrl}/api/register/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    }, this.getSessionToken());

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to submit registration');
    }

    this.clearSessionToken();
    return response.json();
  }

  /**
   * Verify email from verification link
   */
  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    const response = await authFetch(`${this.baseUrl}/api/register/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to verify email');
    }

    return response.json();
  }

  /**
   * Resend verification email
   */
  async resendVerification(email: string): Promise<{ success: boolean; message: string }> {
    const response = await authFetch(`${this.baseUrl}/api/register/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to resend verification');
    }

    return response.json();
  }

  /**
   * Get CAPTCHA token from hCaptcha
   */
  private async getCaptchaToken(): Promise<string | undefined> {
    // Temporarily disable hCaptcha for testing
    logger.log('hCaptcha temporarily disabled for testing');
    return undefined;
    
    // Check if hCaptcha is loaded
    if (typeof window.hcaptcha === 'undefined') {
      logger.warn('hCaptcha not loaded, proceeding without CAPTCHA token');
      return undefined;
    }

    try {
      // Execute invisible hCaptcha
      const token = await window.hcaptcha.execute(import.meta.env.VITE_HCAPTCHA_SITE_KEY, {
        action: 'registration'
      });
      return token;
    } catch (error) {
      logger.warn('hCaptcha execution failed:', error);
      return undefined;
    }
  }
}

export const RegistrationService = new RegistrationServiceClass();