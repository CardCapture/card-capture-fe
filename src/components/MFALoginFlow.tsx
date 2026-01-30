import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getDefaultRedirectPath } from '@/utils/roleRedirect';
import MFAEnrollmentModal from './MFAEnrollmentModal';
import MFAChallengeModal from './MFAChallengeModal';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/utils/logger';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const USE_V2_MFA = false; // Toggle to use new robust MFA implementation

interface MFALoginFlowProps {
  email: string;
  password: string;
  onError: (error: string) => void;
  onSuccess: () => void;
}

const MFALoginFlow: React.FC<MFALoginFlowProps> = ({
  email,
  password,
  onError,
  onSuccess
}) => {
  const [step, setStep] = useState<'login' | 'mfa-check' | 'mfa-challenge' | 'mfa-enroll'>('login');
  const [factorId, setFactorId] = useState<string>('');
  const [challengeId, setChallengeId] = useState<string>('');
  const [phoneLastFour, setPhoneLastFour] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [rememberDevice, setRememberDevice] = useState(true); // Default to true for better UX
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isFirstPasswordLogin, setIsFirstPasswordLogin] = useState(false);
  const [enrollmentRequired, setEnrollmentRequired] = useState(false);

  const { signInWithPassword, profile, user, refetchProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    logger.log('=== MFA LOGIN FLOW MOUNTED ===');
    logger.log('Email:', email);
    logger.log('Password length:', password.length);

    // Check if we're already in a session (e.g., user refreshed during MFA)
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        logger.log('MFALoginFlow: Existing session detected, checking MFA status instead of re-authenticating');
        // User is already authenticated, don't call signInWithPassword again
        // Instead, check their MFA status
        await handleExistingSession(session);
      } else {
        // No existing session, proceed with normal login
        handleLogin();
      }
    };

    checkExistingSession();
  }, []);

  const handleExistingSession = async (session: any) => {
    logger.log('=== HANDLE EXISTING SESSION ===');
    setIsLoading(true);
    setError(null);

    try {
      const userId = session.user.id;
      setUserId(userId);

      logger.log('Existing session for user:', userId);

      // Parallelize profile and MFA settings queries for faster loading
      logger.log('Fetching profile and MFA settings in parallel...');

      const [profileResult, mfaSettingsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('mfa_verified_at')
          .eq('id', userId)
          .single(),
        supabase
          .from('user_mfa_settings')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()
      ]);

      const { data: profile, error: profileError } = profileResult;
      logger.log('Profile mfa_verified_at:', profile?.mfa_verified_at);

      if (profile && profile.mfa_verified_at === null) {
        // User has started a new login session but hasn't completed MFA yet
        logger.log('MFA verification pending for this session');

        const { data: mfaSettings, error: mfaError } = mfaSettingsResult;

        // If user is explicitly exempt from MFA, skip entirely
        if (mfaSettings?.mfa_exempt === true) {
          logger.log('User is exempt from MFA - skipping MFA');
          onSuccess();
          return;
        }

        if (!mfaSettings || !mfaSettings.mfa_enabled) {
          // User doesn't have MFA enabled - complete login
          logger.log('User does not have MFA enabled');
          onSuccess();
          return;
        }

        // Check device trust - if device is trusted, skip MFA
        const deviceToken = localStorage.getItem('device_token');
        if (deviceToken) {
          logger.log('Checking device trust with token:', deviceToken.substring(0, 8) + '...');
          const checkEndpoint = USE_V2_MFA ? '/mfa2/check-device' : '/mfa/check-device';
          const response = await fetch(`${API_BASE_URL}${checkEndpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ device_token: deviceToken })
          });

          const deviceData = await response.json();
          logger.log('Device trust check result:', deviceData);

          if (deviceData.trusted) {
            // Device is trusted - skip MFA and mark as verified
            logger.log('Device is trusted on refresh, skipping MFA');

            // Set mfa_verified_at for this trusted device session
            try {
              await supabase
                .from('profiles')
                .update({ mfa_verified_at: new Date().toISOString() })
                .eq('id', userId);
              logger.log('Set mfa_verified_at for trusted device on refresh');

              // CRITICAL: Force refresh profile to bypass cache
              await refetchProfile(true); // forceRefresh = true
              logger.log('Refetched profile after setting mfa_verified_at');
            } catch (error) {
              logger.error('Error setting mfa_verified_at:', error);
            }

            onSuccess();
            return;
          } else {
            logger.log('Device is NOT trusted - requiring MFA');
          }
        }

        // Create MFA challenge (device not trusted or no device token)
        logger.log('Creating MFA challenge...');
        const mfaEndpoint = USE_V2_MFA ? '/mfa2/challenge' : '/mfa/challenge';
        const challengeResponse = await fetch(`${API_BASE_URL}${mfaEndpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({})
        });

        const challengeData = await challengeResponse.json();
        logger.log('Challenge response data:', challengeData);

        if (!challengeData.mfa_required) {
          logger.log('MFA not required, calling onSuccess');
          onSuccess();
          return;
        }

        // Check if user needs enrollment (corrupted state: MFA enabled but no phone)
        if (challengeData.needs_enrollment) {
          logger.log('MFA enrollment required (missing phone number) - redirecting to enrollment');
          setEnrollmentRequired(true);
          setStep('mfa-enroll');
          return;
        }

        logger.log('Challenge data received:', challengeData);
        setFactorId(challengeData.factor_id || '');
        setChallengeId(challengeData.challenge_id || '');
        setPhoneLastFour(challengeData.phone_masked || '');
        setStep('mfa-challenge');
        return;
      }

      // mfa_verified_at is NOT null, user has already verified MFA for this session
      logger.log('MFA already verified for this session, allowing access');
      onSuccess();

    } catch (err) {
      onError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    logger.log('=== HANDLE LOGIN CALLED ===');
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Attempt password login
      logger.log('Attempting signInWithPassword...');
      const authResponse = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      logger.log('Auth response:', authResponse);

      if (authResponse.error) {
        logger.log('Sign in error:', authResponse.error);
        onError(authResponse.error.message);
        return;
      }

      // Use the session from the auth response directly
      const session = authResponse.data.session;
      
      if (!session?.user) {
        logger.log('No session data in auth response:', authResponse.data);
        onError('Login failed - no session');
        return;
      }

      logger.log('Login successful, user ID:', session.user.id);
      setUserId(session.user.id);

      // Step 2: Parallelize independent queries for faster login
      logger.log('Fetching MFA settings in parallel with clearing verification...');

      const [mfaSettingsResult] = await Promise.all([
        // Fetch MFA settings
        supabase
          .from('user_mfa_settings')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle(),
        // Clear MFA verification status (fire and forget style)
        supabase
          .from('profiles')
          .update({ mfa_verified_at: null })
          .eq('id', session.user.id)
          .then(() => logger.log('Cleared mfa_verified_at for new login session'))
          .catch((error) => logger.error('Error clearing mfa_verified_at:', error))
      ]);

      const { data: mfaSettings, error: mfaError } = mfaSettingsResult;
      logger.log('MFA Settings result:', mfaSettings, mfaError);

      // If user is explicitly exempt from MFA, skip entirely
      // This is for shared accounts like admissions@mc.edu
      if (mfaSettings?.mfa_exempt === true) {
        logger.log('User is exempt from MFA - skipping MFA and enrollment');
        onSuccess();
        return;
      }

      if (!mfaSettings || !mfaSettings.mfa_enabled) {
        // User doesn't have MFA enabled - prompt for enrollment
        logger.log('User does not have MFA enabled, showing enrollment modal');
        setIsFirstPasswordLogin(true);
        setStep('mfa-enroll');
        setIsLoading(false); // Explicitly set loading to false here
        return;
      }

      logger.log('User has MFA enabled, checking device trust...');

      // Step 3: Check if device is trusted
      const deviceToken = localStorage.getItem('device_token');
      const deviceExpires = localStorage.getItem('device_expires');
      logger.log('Device trust check - token exists:', !!deviceToken, 'expires:', deviceExpires);
      
      if (deviceToken) {
        logger.log('Checking device trust with token:', deviceToken.substring(0, 8) + '...');
        const checkEndpoint = USE_V2_MFA ? '/mfa2/check-device' : '/mfa/check-device';
        const response = await fetch(`${API_BASE_URL}${checkEndpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ device_token: deviceToken })
        });

        const deviceData = await response.json();
        logger.log('Device trust check result:', deviceData);
        logger.log('deviceData.trusted:', deviceData.trusted);
        logger.log('deviceData.expired:', deviceData.expired);
        if (deviceData.trusted) {
          // Device is trusted - skip MFA and mark as verified
          logger.log('Device is trusted, skipping MFA');

          // Set mfa_verified_at for this trusted device session
          try {
            await supabase
              .from('profiles')
              .update({ mfa_verified_at: new Date().toISOString() })
              .eq('id', session.user.id);
            logger.log('Set mfa_verified_at for trusted device');

            // CRITICAL: Force refresh profile to bypass cache
            await refetchProfile(true); // forceRefresh = true
            logger.log('Refetched profile after setting mfa_verified_at');
          } catch (error) {
            logger.error('Error setting mfa_verified_at:', error);
          }

          onSuccess();
          return;
        } else {
          logger.log('Device is NOT trusted - requiring MFA');
          logger.log('Reason: trusted=', deviceData.trusted, 'expired=', deviceData.expired);
        }
      }

      // Step 4: Create MFA challenge
      logger.log('Creating MFA challenge...');
      const mfaEndpoint = USE_V2_MFA ? '/mfa2/challenge' : '/mfa/challenge';
      const challengeResponse = await fetch(`${API_BASE_URL}${mfaEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({})
      });

      logger.log('Challenge response status:', challengeResponse.status);
      const challengeData = await challengeResponse.json();
      logger.log('Challenge response data:', challengeData);
      logger.log('challengeData.mfa_required:', challengeData.mfa_required);

      if (!challengeData.mfa_required) {
        logger.log('MFA not required, calling onSuccess');
        onSuccess();
        return;
      }

      // Check if user needs enrollment (corrupted state: MFA enabled but no phone)
      if (challengeData.needs_enrollment) {
        logger.log('MFA enrollment required (missing phone number) - redirecting to enrollment');
        setEnrollmentRequired(true);
        setStep('mfa-enroll');
        return;
      }

      logger.log('Challenge data received:', challengeData);
      logger.log('Setting factorId to:', challengeData.factor_id);
      logger.log('Setting challengeId to:', challengeData.challenge_id);
      logger.log('Setting phoneLastFour to:', challengeData.phone_masked);
      setFactorId(challengeData.factor_id || '');
      setChallengeId(challengeData.challenge_id || '');
      setPhoneLastFour(challengeData.phone_masked || '');
      logger.log('Setting step to mfa-challenge');
      setStep('mfa-challenge');
      logger.log('Step set complete');

    } catch (err) {
      onError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFAVerify = async (code: string) => {
    // Don't allow new attempts if rate limited
    if (isRateLimited) {
      return;
    }

    setIsLoading(true);
    // Don't clear error if already rate limited
    if (!isRateLimited) {
      setError(null);
    }

    logger.log('MFA Verify called with factorId:', factorId);
    logger.log('Code:', code);

    try {
      const verifyEndpoint = USE_V2_MFA ? '/mfa2/verify' : '/mfa/verify';

      // Prepare headers with current device token if available
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      };

      // Include current device token in headers for smart token management
      const currentDeviceToken = localStorage.getItem('device_token');
      if (currentDeviceToken) {
        headers['X-Device-Token'] = currentDeviceToken;
      }

      const response = await fetch(`${API_BASE_URL}${verifyEndpoint}`, {
        method: 'POST',
        headers,
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
        // Check if this is a rate limit error
        if (response.status === 429) {
          setIsRateLimited(true);
          setError(data.detail || 'Too many attempts. Please try again in 15 minutes.');
          throw new Error(data.detail || 'Too many attempts. Please try again in 15 minutes.');
        }
        throw new Error(data.detail || 'Invalid code');
      }

      // Update the session if MFA verification returned new tokens
      if (data.session) {
        logger.log('MFA verify returned new session, updating auth state');
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
      }
      
      // Store device token if remember device was selected
      if (rememberDevice && data.device_token) {
        logger.log('Storing device token for 30-day trust:', data.device_token.substring(0, 8) + '...');
        localStorage.setItem('device_token', data.device_token);
        localStorage.setItem('device_expires', data.device_expires_at);
      } else {
        logger.log('Device token not stored. rememberDevice:', rememberDevice, 'device_token present:', !!data.device_token);
      }

      // CRITICAL: Set mfa_verified_at in profiles after successful MFA verification
      // This ensures the user can access protected routes
      const currentSession = await supabase.auth.getSession();
      const currentUserId = currentSession.data.session?.user?.id;

      if (currentUserId) {
        try {
          logger.log('Setting mfa_verified_at after successful MFA verification');
          await supabase
            .from('profiles')
            .update({ mfa_verified_at: new Date().toISOString() })
            .eq('id', currentUserId);
          logger.log('Successfully set mfa_verified_at for user:', currentUserId);
        } catch (error) {
          logger.error('Error setting mfa_verified_at:', error);
          // Don't block login if this fails - the backend might have already set it
        }
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFAResend = async () => {
    setError(null);
    
    try {
      const resendEndpoint = USE_V2_MFA ? '/mfa2/challenge' : '/mfa/challenge';
      const response = await fetch(`${API_BASE_URL}${resendEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({})
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to resend code');
      }

      setChallengeId(data.challenge_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend');
    }
  };

  const handleEnrollmentComplete = () => {
    // User just completed MFA enrollment and verified their phone
    // No need for additional verification - complete login
    onSuccess();
  };

  const handleEnrollmentSkip = () => {
    // User skipped enrollment, complete login
    onSuccess();
  };

  logger.log('MFALoginFlow render - current step:', step);
  logger.log('MFALoginFlow render - factorId:', factorId);
  logger.log('MFALoginFlow render - challengeId:', challengeId);

  if (step === 'mfa-enroll') {
    return (
      <MFAEnrollmentModal
        isOpen={true}
        onClose={() => onSuccess()}
        onComplete={handleEnrollmentComplete}
        onSkip={handleEnrollmentSkip}
        isRequired={enrollmentRequired} // Required if user has corrupted MFA state
      />
    );
  }

  if (step === 'mfa-challenge') {
    return (
      <MFAChallengeModal
        isOpen={true}
        onComplete={handleMFAVerify}
        onResend={handleMFAResend}
        isLoading={isLoading || isRateLimited}
        error={error}
        phoneLastFour={phoneLastFour}
        rememberDevice={rememberDevice}
        onRememberDeviceChange={setRememberDevice}
      />
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
};

export default MFALoginFlow;