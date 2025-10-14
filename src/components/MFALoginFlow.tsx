import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getDefaultRedirectPath } from '@/utils/roleRedirect';
import MFAEnrollmentModal from './MFAEnrollmentModal';
import MFAChallengeModal from './MFAChallengeModal';
import { supabase } from '@/lib/supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const USE_V2_MFA = true; // Toggle to use new robust MFA implementation

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
    console.log('=== MFA LOGIN FLOW MOUNTED ===');
    console.log('Email:', email);
    console.log('Password length:', password.length);

    // Check if we're already in a session (e.g., user refreshed during MFA)
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('MFALoginFlow: Existing session detected, checking MFA status instead of re-authenticating');
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
    console.log('=== HANDLE EXISTING SESSION ===');
    setIsLoading(true);
    setError(null);

    try {
      const userId = session.user.id;
      setUserId(userId);

      console.log('Existing session for user:', userId);

      // Check if mfa_verified_at is null - this means user started a new login but hasn't completed MFA
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('mfa_verified_at')
        .eq('id', userId)
        .single();

      console.log('Profile mfa_verified_at:', profile?.mfa_verified_at);

      if (profile && profile.mfa_verified_at === null) {
        // User has started a new login session but hasn't completed MFA yet
        console.log('MFA verification pending for this session');

        // Check if user has MFA enabled
        const { data: mfaSettings, error: mfaError } = await supabase
          .from('user_mfa_settings')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (!mfaSettings || !mfaSettings.mfa_enabled) {
          // User doesn't have MFA enabled - complete login
          console.log('User does not have MFA enabled');
          onSuccess();
          return;
        }

        // Check device trust - if device is trusted, skip MFA
        const deviceToken = localStorage.getItem('device_token');
        if (deviceToken) {
          console.log('Checking device trust with token:', deviceToken.substring(0, 8) + '...');
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
          console.log('Device trust check result:', deviceData);

          if (deviceData.trusted) {
            // Device is trusted - skip MFA and mark as verified
            console.log('Device is trusted on refresh, skipping MFA');

            // Set mfa_verified_at for this trusted device session
            try {
              await supabase
                .from('profiles')
                .update({ mfa_verified_at: new Date().toISOString() })
                .eq('id', userId);
              console.log('Set mfa_verified_at for trusted device on refresh');

              // Refetch profile to ensure AuthContext has the updated mfa_verified_at
              await refetchProfile();
              console.log('Refetched profile after setting mfa_verified_at');
            } catch (error) {
              console.error('Error setting mfa_verified_at:', error);
            }

            onSuccess();
            return;
          } else {
            console.log('Device is NOT trusted - requiring MFA');
          }
        }

        // Create MFA challenge (device not trusted or no device token)
        console.log('Creating MFA challenge...');
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
        console.log('Challenge response data:', challengeData);

        if (!challengeData.mfa_required) {
          console.log('MFA not required, calling onSuccess');
          onSuccess();
          return;
        }

        // Check if user needs enrollment (corrupted state: MFA enabled but no phone)
        if (challengeData.needs_enrollment) {
          console.log('MFA enrollment required (missing phone number) - redirecting to enrollment');
          setEnrollmentRequired(true);
          setStep('mfa-enroll');
          return;
        }

        console.log('Challenge data received:', challengeData);
        setFactorId(challengeData.factor_id || '');
        setChallengeId(challengeData.challenge_id || '');
        setPhoneLastFour(challengeData.phone_masked || '');
        setStep('mfa-challenge');
        return;
      }

      // mfa_verified_at is NOT null, user has already verified MFA for this session
      console.log('MFA already verified for this session, allowing access');
      onSuccess();

    } catch (err) {
      onError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    console.log('=== HANDLE LOGIN CALLED ===');
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Attempt password login
      console.log('Attempting signInWithPassword...');
      const authResponse = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Auth response:', authResponse);

      if (authResponse.error) {
        console.log('Sign in error:', authResponse.error);
        onError(authResponse.error.message);
        return;
      }

      // Use the session from the auth response directly
      const session = authResponse.data.session;
      
      if (!session?.user) {
        console.log('No session data in auth response:', authResponse.data);
        onError('Login failed - no session');
        return;
      }

      console.log('Login successful, user ID:', session.user.id);
      setUserId(session.user.id);

      // Clear MFA verification status and device trust for this new session
      try {
        await supabase
          .from('profiles')
          .update({ mfa_verified_at: null })
          .eq('id', session.user.id);
        console.log('Cleared mfa_verified_at for new login session');
      } catch (error) {
        console.error('Error clearing mfa_verified_at:', error);
      }

      // Step 2: Check if user has MFA enabled
      console.log('Checking MFA settings for user:', session.user.id);
      
      const { data: mfaSettings, error: mfaError } = await supabase
        .from('user_mfa_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle no rows gracefully

      console.log('MFA Settings result:', mfaSettings, mfaError);

      if (!mfaSettings || !mfaSettings.mfa_enabled) {
        // User doesn't have MFA enabled - prompt for enrollment
        console.log('User does not have MFA enabled, showing enrollment modal');
        setIsFirstPasswordLogin(true);
        setStep('mfa-enroll');
        setIsLoading(false); // Explicitly set loading to false here
        return;
      }

      console.log('User has MFA enabled, checking device trust...');

      // Step 3: Check if device is trusted
      const deviceToken = localStorage.getItem('device_token');
      const deviceExpires = localStorage.getItem('device_expires');
      console.log('Device trust check - token exists:', !!deviceToken, 'expires:', deviceExpires);
      
      if (deviceToken) {
        console.log('Checking device trust with token:', deviceToken.substring(0, 8) + '...');
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
        console.log('Device trust check result:', deviceData);
        console.log('deviceData.trusted:', deviceData.trusted);
        console.log('deviceData.expired:', deviceData.expired);
        if (deviceData.trusted) {
          // Device is trusted - skip MFA and mark as verified
          console.log('Device is trusted, skipping MFA');

          // Set mfa_verified_at for this trusted device session
          try {
            await supabase
              .from('profiles')
              .update({ mfa_verified_at: new Date().toISOString() })
              .eq('id', session.user.id);
            console.log('Set mfa_verified_at for trusted device');

            // Refetch profile to ensure AuthContext has the updated mfa_verified_at
            await refetchProfile();
            console.log('Refetched profile after setting mfa_verified_at');
          } catch (error) {
            console.error('Error setting mfa_verified_at:', error);
          }

          onSuccess();
          return;
        } else {
          console.log('Device is NOT trusted - requiring MFA');
          console.log('Reason: trusted=', deviceData.trusted, 'expired=', deviceData.expired);
        }
      }

      // Step 4: Create MFA challenge
      console.log('Creating MFA challenge...');
      const mfaEndpoint = USE_V2_MFA ? '/mfa2/challenge' : '/mfa/challenge';
      const challengeResponse = await fetch(`${API_BASE_URL}${mfaEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({})
      });

      console.log('Challenge response status:', challengeResponse.status);
      const challengeData = await challengeResponse.json();
      console.log('Challenge response data:', challengeData);
      console.log('challengeData.mfa_required:', challengeData.mfa_required);

      if (!challengeData.mfa_required) {
        console.log('MFA not required, calling onSuccess');
        onSuccess();
        return;
      }

      // Check if user needs enrollment (corrupted state: MFA enabled but no phone)
      if (challengeData.needs_enrollment) {
        console.log('MFA enrollment required (missing phone number) - redirecting to enrollment');
        setEnrollmentRequired(true);
        setStep('mfa-enroll');
        return;
      }

      console.log('Challenge data received:', challengeData);
      console.log('Setting factorId to:', challengeData.factor_id);
      console.log('Setting challengeId to:', challengeData.challenge_id);
      console.log('Setting phoneLastFour to:', challengeData.phone_masked);
      setFactorId(challengeData.factor_id || '');
      setChallengeId(challengeData.challenge_id || '');
      setPhoneLastFour(challengeData.phone_masked || '');
      console.log('Setting step to mfa-challenge');
      setStep('mfa-challenge');
      console.log('Step set complete');

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

    console.log('MFA Verify called with factorId:', factorId);
    console.log('Code:', code);

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
        console.log('MFA verify returned new session, updating auth state');
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
      }
      
      // Store device token if remember device was selected
      if (rememberDevice && data.device_token) {
        console.log('Storing device token for 30-day trust:', data.device_token.substring(0, 8) + '...');
        localStorage.setItem('device_token', data.device_token);
        localStorage.setItem('device_expires', data.device_expires_at);
      } else {
        console.log('Device token not stored. rememberDevice:', rememberDevice, 'device_token present:', !!data.device_token);
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

  console.log('MFALoginFlow render - current step:', step);
  console.log('MFALoginFlow render - factorId:', factorId);
  console.log('MFALoginFlow render - challengeId:', challengeId);

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