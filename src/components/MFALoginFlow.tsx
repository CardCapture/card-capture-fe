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
  const [isFirstPasswordLogin, setIsFirstPasswordLogin] = useState(false);
  
  const { signInWithPassword, profile, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('=== MFA LOGIN FLOW MOUNTED ===');
    console.log('Email:', email);
    console.log('Password length:', password.length);
    handleLogin();
  }, []);

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

      // Step 2: Check if user has MFA enabled
      console.log('Checking MFA settings for user:', session.user.id);
      const { data: mfaSettings, error: mfaError } = await supabase
        .from('user_mfa_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

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
        if (deviceData.trusted) {
          // Device is trusted - skip MFA
          console.log('Device is trusted, skipping MFA');
          onSuccess();
          return;
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
    setIsLoading(true);
    setError(null);

    console.log('MFA Verify called with factorId:', factorId);
    console.log('Code:', code);

    try {
      const verifyEndpoint = USE_V2_MFA ? '/mfa2/verify' : '/mfa/verify';
      const response = await fetch(`${API_BASE_URL}${verifyEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
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
        isRequired={false}
      />
    );
  }

  if (step === 'mfa-challenge') {
    return (
      <MFAChallengeModal
        isOpen={true}
        onComplete={handleMFAVerify}
        onResend={handleMFAResend}
        isLoading={isLoading}
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