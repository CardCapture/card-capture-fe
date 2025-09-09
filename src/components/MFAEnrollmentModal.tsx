import React, { useState } from 'react';
import OTPInput from './OTPInput';
import { supabase } from '../lib/supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const USE_V2_MFA = true; // Use new robust MFA implementation

interface MFAEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  onSkip?: () => void;
  isRequired?: boolean;
}

const MFAEnrollmentModal: React.FC<MFAEnrollmentModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  onSkip,
  isRequired = false
}) => {
  const [step, setStep] = useState<'phone' | 'verify' | 'backup' | 'success'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [factorId, setFactorId] = useState<string>('');
  const [challengeId, setChallengeId] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);
  const [consentToSMS, setConsentToSMS] = useState(false);
  const [showSMSDetails, setShowSMSDetails] = useState(false);

  if (!isOpen) return null;

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX for US numbers
    if (countryCode === '+1') {
      if (digits.length <= 3) {
        return digits;
      } else if (digits.length <= 6) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      } else {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
      }
    }
    
    return digits;
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!consentToSMS) {
      setError('You must consent to receive SMS messages to enable 2FA');
      return;
    }

    setIsLoading(true);

    try {
      // Clean phone number - remove all formatting
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      
      // For US numbers, ensure we format correctly for international use
      let fullPhone: string;
      if (countryCode === '+1') {
        // For US numbers, format as +15126946172 (E.164 format without spaces)
        if (cleanPhone.length === 10) {
          fullPhone = `+1${cleanPhone}`;
        } else {
          fullPhone = `+1${cleanPhone}`;
        }
      } else {
        fullPhone = `${countryCode}${cleanPhone}`;
      }

      console.log('=== PHONE NUMBER DEBUG ===');
      console.log('Input phoneNumber:', phoneNumber);
      console.log('After replacing non-digits:', cleanPhone);
      console.log('Country code:', countryCode);
      console.log('Final fullPhone:', fullPhone);
      console.log('========================');

      const enrollEndpoint = USE_V2_MFA ? '/mfa2/enroll' : '/mfa/enroll';
      const response = await fetch(`${API_BASE_URL}${enrollEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ phone_number: fullPhone })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send verification code');
      }

      setFactorId(data.factor_id);
      setChallengeId(data.challenge_id || '');
      setStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const verifyEndpoint = USE_V2_MFA ? '/mfa2/verify-enrollment' : '/mfa/verify-enrollment';
      const response = await fetch(`${API_BASE_URL}${verifyEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ factor_id: factorId, code, challenge_id: challengeId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Invalid verification code');
      }

      // Update the session if MFA verification returned new tokens
      if (data.session) {
        console.log('MFA enrollment returned new session, updating auth state');
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
      }

      // Show success message before completing
      setStep('success');
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        onComplete();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);
    await handlePhoneSubmit(new Event('submit') as any);
  };

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setCopiedBackupCodes(true);
    setTimeout(() => setCopiedBackupCodes(false), 3000);
  };

  const handleComplete = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        {/* Close button */}
        {!isRequired && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Phone Input Step */}
        {step === 'phone' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Secure Your Account</h2>
              <p className="text-gray-600">
                Add two-factor authentication to protect your account from unauthorized access.
              </p>
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>How it works:</strong> We'll send a 6-digit verification code via SMS to your phone 
                  when you log in. This ensures only you can access your account.
                </p>
              </div>
            </div>

            <form onSubmit={handlePhoneSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="flex space-x-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+61">🇦🇺 +61</option>
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+86">🇨🇳 +86</option>
                  </select>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                    placeholder="(555) 555-5555"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    checked={consentToSMS}
                    onChange={(e) => setConsentToSMS(e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    required
                  />
                  <div className="text-sm text-gray-700">
                    <span>
                      I consent to receive SMS verification codes from CardCapture for account security. 
                      Message and data rates may apply.
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSMSDetails(!showSMSDetails)}
                      className="ml-2 text-blue-600 hover:text-blue-800 underline text-xs"
                    >
                      {showSMSDetails ? 'Hide details' : 'View SMS terms'}
                    </button>
                  </div>
                </label>

                {showSMSDetails && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-gray-600">
                    <ul className="space-y-1">
                      <li><strong>Frequency:</strong> Up to 5 messages per login session</li>
                      <li><strong>Content:</strong> 6-digit verification codes only</li>
                      <li><strong>From:</strong> CardCapture or short code</li>
                      <li><strong>To stop:</strong> Reply STOP to any message</li>
                      <li><strong>Help:</strong> Reply HELP or email support@cardcapture.io</li>
                    </ul>
                    <p className="mt-2">
                      <a href="https://cardcapture.io/privacy" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
                      {' | '}
                      <a href="https://cardcapture.io/terms" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Terms</a>
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="text-red-600 text-sm mb-4">
                  {error}
                </div>
              )}

              <div className="flex space-x-3">
                {!isRequired && onSkip && (
                  <button
                    type="button"
                    onClick={onSkip}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Skip for now
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading || !consentToSMS}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Send Code'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Verification Step */}
        {step === 'verify' && (
          <OTPInput
            onComplete={handleVerifyCode}
            onResend={handleResendCode}
            isLoading={isLoading}
            error={error}
            phoneLastFour={phoneNumber.slice(-4)}
          />
        )}

        {/* Success Confirmation Step */}
        {step === 'success' && (
          <div className="text-center">
            <div className="mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">2FA Successfully Enabled!</h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left mb-4">
                <p className="text-sm text-green-800 font-semibold mb-2">
                  ✅ Opt-In Confirmation
                </p>
                <p className="text-xs text-green-700">
                  You are successfully enrolled in CardCapture 2FA. You will receive automated verification codes 
                  via SMS when logging in. Message frequency: up to 5 messages per login session. 
                  Message and data rates may apply.
                </p>
                <p className="text-xs text-green-700 mt-2">
                  <strong>To opt-out:</strong> Reply STOP to any message or disable 2FA in account settings<br/>
                  <strong>For help:</strong> Reply HELP or contact support@cardcapture.io
                </p>
              </div>
              <p className="text-gray-600 text-sm">
                Your account is now protected with two-factor authentication.
              </p>
            </div>
          </div>
        )}

        {/* Backup Codes Step */}
        {step === 'backup' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Save Your Backup Codes</h2>
              <p className="text-gray-600">
                Store these codes safely. You can use them to access your account if you lose your phone.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {backupCodes.map((code, index) => (
                  <div key={index} className="bg-white px-3 py-2 rounded border border-gray-200">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={copyBackupCodes}
              className="w-full mb-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              {copiedBackupCodes ? 'Copied!' : 'Copy All Codes'}
            </button>

            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-4">
              <p className="text-sm text-yellow-800">
                ⚠️ Each code can only be used once. After using a backup code, you'll need to generate new ones.
              </p>
            </div>

            <button
              onClick={handleComplete}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              I've Saved My Codes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MFAEnrollmentModal;