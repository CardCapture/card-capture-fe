import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MFAEnrollmentModal from './MFAEnrollmentModal';
import MFAChallengeModal from './MFAChallengeModal';
import { supabase } from '@/lib/supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * MFA State Machine:
 * 1. Login → Check device trust
 * 2. Device trusted → Grant access
 * 3. Device not trusted → Check if user has phone number
 * 4. No phone → Show enrollment modal
 * 5. Has phone → Show challenge modal
 * 6. Code verified → Grant access + optionally save device
 */

type MFAStep = 'checking' | 'trusted' | 'need-enrollment' | 'need-challenge' | 'complete';

interface MFAGuardProps {
  email: string;
  password: string;
  onError: (error: string) => void;
  onSuccess: () => void;
}

const MFAGuard: React.FC<MFAGuardProps> = ({ email, password, onError, onSuccess }) => {
  const [step, setStep] = useState<MFAStep>('checking');
  const [factorId, setFactorId] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [phoneMasked, setPhoneMasked] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const { signInWithPassword, user, refetchProfile } = useAuth();
  const navigate = useNavigate();

  // Maximum retry attempts before forcing logout
  const MAX_ATTEMPTS = 3;

  useEffect(() => {
    console.log('[MFAGuard] Starting MFA flow');
    startMFAFlow();
  }, []);

  const startMFAFlow = async () => {
    if (attemptCount >= MAX_ATTEMPTS) {
      handleCircuitBreaker();
      return;
    }

    setAttemptCount(prev => prev + 1);
    setIsLoading(true);

    try {
      // Step 1: Authenticate with Supabase
      console.log('[MFAGuard] Step 1: Authenticating with Supabase');
      const result = await signInWithPassword({ email, password });

      if (result.error) {
        onError(result.error.message || 'Authentication failed');
        return;
      }

      // Get session after successful authentication
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        onError('Failed to establish session');
        return;
      }

      const userId = session.user.id;
      const accessToken = session.access_token;

      // Step 2: Check device trust
      console.log('[MFAGuard] Step 2: Checking device trust');
      const deviceToken = localStorage.getItem('device_token');

      if (deviceToken) {
        const deviceTrusted = await checkDeviceTrust(deviceToken, accessToken);
        if (deviceTrusted) {
          console.log('[MFAGuard] Device is trusted - skipping MFA');

          // IMPORTANT: Force refresh profile to get updated mfa_verified_at
          console.log('[MFAGuard] Force refreshing profile after device trust check');
          await refetchProfile(true);  // forceRefresh = true

          // Small delay to ensure database update has propagated
          await new Promise(resolve => setTimeout(resolve, 500));

          handleSuccess();
          return;
        }
      }

      // Step 3: Check if user has MFA configured
      console.log('[MFAGuard] Step 3: Checking MFA configuration');
      const needsEnrollment = await checkMFAStatus(userId);

      if (needsEnrollment) {
        console.log('[MFAGuard] User needs enrollment');
        setStep('need-enrollment');
      } else {
        console.log('[MFAGuard] Sending MFA challenge');
        await sendMFAChallenge(accessToken);
      }
    } catch (error: any) {
      console.error('[MFAGuard] Error in MFA flow:', error);
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkDeviceTrust = async (deviceToken: string, accessToken: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/mfa/check-device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ device_token: deviceToken }),
      });

      if (!response.ok) {
        console.warn('[MFAGuard] Device trust check failed');
        return false;
      }

      const data = await response.json();
      return data.trusted === true;
    } catch (error) {
      console.error('[MFAGuard] Device trust check error:', error);
      return false;
    }
  };

  const checkMFAStatus = async (userId: string): Promise<boolean> => {
    try {
      const { data: mfaSettings } = await supabase
        .from('user_mfa_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // User needs enrollment if:
      // 1. No MFA settings exist
      // 2. MFA not enabled
      // 3. No phone number
      const needsEnrollment =
        !mfaSettings ||
        !mfaSettings.mfa_enabled ||
        !mfaSettings.phone_number;

      return needsEnrollment;
    } catch (error) {
      console.error('[MFAGuard] Error checking MFA status:', error);
      return true; // Default to enrollment if check fails
    }
  };

  const sendMFAChallenge = async (accessToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/mfa/challenge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.needs_enrollment) {
          setStep('need-enrollment');
          return;
        }
        throw new Error(data.detail || 'Failed to send challenge');
      }

      setFactorId(data.factor_id);
      setChallengeId(data.challenge_id);
      setPhoneMasked(data.phone_masked || '');
      setStep('need-challenge');
    } catch (error: any) {
      handleError(error);
    }
  };

  const handleEnrollmentComplete = async (deviceToken?: string) => {
    console.log('[MFAGuard] Enrollment complete');

    if (deviceToken) {
      localStorage.setItem('device_token', deviceToken);
    }

    // IMPORTANT: Force refresh profile to get updated mfa_verified_at
    console.log('[MFAGuard] Force refreshing profile to get mfa_verified_at');
    await refetchProfile(true);  // forceRefresh = true

    // Small delay to ensure database update has propagated
    await new Promise(resolve => setTimeout(resolve, 500));

    handleSuccess();
  };

  const handleChallengeComplete = async (deviceToken?: string) => {
    console.log('[MFAGuard] Challenge complete');

    if (deviceToken) {
      localStorage.setItem('device_token', deviceToken);
    }

    // IMPORTANT: Force refresh profile to get updated mfa_verified_at
    console.log('[MFAGuard] Force refreshing profile to get mfa_verified_at');
    await refetchProfile(true);  // forceRefresh = true

    // Small delay to ensure database update has propagated
    await new Promise(resolve => setTimeout(resolve, 500));

    handleSuccess();
  };

  const handleSuccess = () => {
    console.log('[MFAGuard] MFA flow complete - success!');
    setStep('complete');

    // Let the parent (LoginPage) handle navigation
    onSuccess();
  };

  const handleError = (error: any) => {
    const errorMessage = error.message || error.detail || 'MFA verification failed';
    console.error('[MFAGuard] Error:', errorMessage);

    if (errorMessage.includes('RATE_LIMITED')) {
      const parts = errorMessage.split('|');
      const minutes = parts[1] || '15';
      onError(`Too many attempts. Please try again in ${minutes} minutes.`);
    } else {
      onError(errorMessage);
    }
  };

  const handleCircuitBreaker = () => {
    console.error('[MFAGuard] Circuit breaker triggered - max attempts exceeded');
    onError('Too many failed attempts. Please try logging in again.');

    // Sign out user
    supabase.auth.signOut();

    // Clear any stored tokens
    localStorage.removeItem('device_token');

    // Navigate to login
    navigate('/login');
  };

  const handleModalClose = () => {
    // User closed modal - sign them out
    console.log('[MFAGuard] User closed MFA modal - signing out');
    supabase.auth.signOut();
    localStorage.removeItem('device_token');
    navigate('/login');
  };

  // Render appropriate modal based on step
  if (step === 'need-enrollment') {
    return (
      <MFAEnrollmentModal
        isOpen={true}
        onClose={handleModalClose}
        onSuccess={handleEnrollmentComplete}
        onError={handleError}
      />
    );
  }

  if (step === 'need-challenge') {
    return (
      <MFAChallengeModal
        isOpen={true}
        onClose={handleModalClose}
        factorId={factorId}
        challengeId={challengeId}
        phoneMasked={phoneMasked}
        onSuccess={handleChallengeComplete}
        onError={handleError}
      />
    );
  }

  // Loading state
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">
          {step === 'checking' && 'Checking security...'}
          {step === 'trusted' && 'Verifying device...'}
          {step === 'complete' && 'Access granted!'}
        </p>
      </div>
    </div>
  );
};

export default MFAGuard;
