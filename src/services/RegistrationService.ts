import { authFetch } from '@/lib/authFetch';

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

  /**
   * Start registration with email (magic link flow)
   */
  async startEmailRegistration(email: string): Promise<{ success: boolean; message: string }> {
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
  async verifyEventCode(code: string): Promise<{ success: boolean; redirect: string; event?: any }> {
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

    return response.json();
  }

  /**
   * Verify magic link token (called when user clicks email link)
   */
  async verifyMagicLink(token: string): Promise<{ success: boolean; email: string; redirect: string }> {
    const response = await authFetch(`${this.baseUrl}/api/register/verify-magic-link?token=${token}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to verify magic link');
    }

    return response.json();
  }

  /**
   * Get current form session data
   */
  async getFormSession(): Promise<FormSession> {
    const response = await authFetch(`${this.baseUrl}/api/register/form-session`, {
      method: 'GET',
    });

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
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to submit registration');
    }

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
    console.log('hCaptcha temporarily disabled for testing');
    return undefined;
    
    // Check if hCaptcha is loaded
    if (typeof window.hcaptcha === 'undefined') {
      console.warn('hCaptcha not loaded, proceeding without CAPTCHA token');
      return undefined;
    }

    try {
      // Execute invisible hCaptcha
      const token = await window.hcaptcha.execute(import.meta.env.VITE_HCAPTCHA_SITE_KEY, {
        action: 'registration'
      });
      return token;
    } catch (error) {
      console.warn('hCaptcha execution failed:', error);
      return undefined;
    }
  }
}

export const RegistrationService = new RegistrationServiceClass();