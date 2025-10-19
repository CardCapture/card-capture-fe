import React, { useState } from 'react';
import OTPInput from './OTPInput';
import { supabase } from '../lib/supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface MFAChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  factorId: string;
  challengeId: string;
  phoneMasked: string;
  onSuccess: (deviceToken?: string) => void;
  onError: (error: string) => void;
}

const MFAChallengeModal: React.FC<MFAChallengeModalProps> = ({
  isOpen,
  onClose,
  factorId,
  challengeId,
  phoneMasked,
  onSuccess,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberDevice, setRememberDevice] = useState(false);

  if (!isOpen) return null;

  const handleVerifyCode = async (code: string) => {
    setError(null);
    setIsLoading(true);

    try {
      console.log('[Challenge] Verifying code...');

      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;

      if (!accessToken) {
        throw new Error('No active session');
      }

      const response = await fetch(`${API_BASE_URL}/mfa/verify`, {
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

      console.log('[Challenge] Verification successful!');

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

  const handleResend = async () => {
    setError(null);
    setIsLoading(true);

    try {
      console.log('[Challenge] Resending code...');

      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;

      if (!accessToken) {
        throw new Error('No active session');
      }

      // Request a new challenge
      const response = await fetch(`${API_BASE_URL}/mfa/challenge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to resend code');
      }

      console.log('[Challenge] Code resent successfully');
      setError(null);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to resend code';
      setError(errorMsg);
      onError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Verify Your Identity</h2>
          <p className="text-sm text-gray-600 mt-2">
            Enter the 6-digit code sent to your phone ending in {phoneMasked}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <OTPInput
            length={6}
            onComplete={handleVerifyCode}
            disabled={isLoading}
          />
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
              disabled={isLoading}
            />
            <span className="text-sm text-gray-700">
              Remember this device for 30 days
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            You won't need to enter a code on this device for 30 days
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleResend}
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
    </div>
  );
};

export default MFAChallengeModal;
