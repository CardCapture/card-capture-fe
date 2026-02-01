import React, { useState } from 'react';
import OTPInput from './OTPInput';
import { supabase } from '../lib/supabaseClient';
import { logger } from '@/utils/logger';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface MFAEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (deviceToken?: string) => void;
  onError: (error: string) => void;
}

type Step = 'phone' | 'verify';

const MFAEnrollmentModal: React.FC<MFAEnrollmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError
}) => {
  const [step, setStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [factorId, setFactorId] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberDevice, setRememberDevice] = useState(true);

  if (!isOpen) return null;

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');

    if (countryCode === '+1') {
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }

    return digits;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phoneNumber.replace(/\D/g, '');

    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);

    try {
      const fullPhone = `${countryCode}${cleanPhone}`;
      logger.log('[Enroll] Sending code to:', fullPhone);

      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;

      if (!accessToken) {
        throw new Error('No active session');
      }

      const response = await fetch(`${API_BASE_URL}/mfa/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ phone_number: fullPhone })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send verification code');
      }

      setFactorId(data.factor_id);
      setChallengeId(data.challenge_id);
      setStep('verify');
      logger.log('[Enroll] Code sent successfully');
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to send code';
      setError(errorMsg);
      onError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    setError(null);
    setIsLoading(true);

    try {
      logger.log('[Enroll] Verifying code...');

      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;

      if (!accessToken) {
        throw new Error('No active session');
      }

      const response = await fetch(`${API_BASE_URL}/mfa/verify-enrollment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          factor_id: factorId,
          challenge_id: challengeId,
          code,
          remember_device: rememberDevice,
          device_name: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorDetail = data.detail || 'Invalid verification code';

        if (errorDetail.includes('INVALID_CODE')) {
          throw new Error('Invalid code. Please try again.');
        } else if (errorDetail.includes('CODE_EXPIRED')) {
          throw new Error('Code expired. Please request a new one.');
        } else if (errorDetail.includes('RATE_LIMITED')) {
          const parts = errorDetail.split('|');
          const minutes = parts[1] || '15';
          throw new Error(`Too many attempts. Please try again in ${minutes} minutes.`);
        } else {
          throw new Error(errorDetail);
        }
      }

      logger.log('[Enroll] Enrollment successful!');

      // Save device token if provided
      const deviceToken = data.device_token;
      if (deviceToken) {
        localStorage.setItem('device_token', deviceToken);
        localStorage.setItem('device_expires_at', data.device_expires_at);
      }

      // Refresh session if provided
      if (data.session) {
        await supabase.auth.setSession(data.session);
      }

      onSuccess(deviceToken);
    } catch (err: any) {
      const errorMsg = err.message || 'Verification failed';
      setError(errorMsg);
      onError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    // Reset to phone step to trigger new code send
    setStep('phone');
    setError(null);
    // Automatically submit
    await handlePhoneSubmit(new Event('submit') as any);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Enable Two-Factor Authentication</h2>
          <p className="text-sm text-gray-600 mt-2">
            {step === 'phone' && 'Enter your phone number to receive a verification code'}
            {step === 'verify' && 'Enter the 6-digit code sent to your phone'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                  <option value="+91">+91</option>
                </select>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="(555) 123-4567"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="w-4 h-4 text-blue-600"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-700">
                  Remember this device for 30 days
                </span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending...' : 'Send Code'}
              </button>
            </div>
          </form>
        )}

        {step === 'verify' && (
          <div>
            <div className="mb-6">
              <OTPInput
                length={6}
                onComplete={handleVerifyCode}
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleResendCode}
                disabled={isLoading}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Resend Code
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Didn't receive a code? Check your phone and try resending.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MFAEnrollmentModal;
