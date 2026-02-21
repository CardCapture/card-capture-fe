import React, { useState, useRef, useEffect, ClipboardEvent } from 'react';

interface OTPInputProps {
  length?: number;
  onComplete: (code: string) => void;
  onResend?: () => void;
  isLoading?: boolean;
  error?: string | null;
  phoneLastFour?: string;
}

const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  onComplete,
  onResend,
  isLoading = false,
  error = null,
  phoneLastFour
}) => {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(''));
  const [resendTimer, setResendTimer] = useState<number>(30);
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the hidden input on mount so iOS autofill targets it
    hiddenInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (lockoutUntil && lockoutUntil > Date.now()) {
      const timer = setInterval(() => {
        const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
        if (remaining > 0) {
          setClientError(`Too many attempts. Please wait ${remaining} seconds.`);
        } else {
          setLockoutUntil(null);
          setClientError(null);
          setAttemptCount(0);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutUntil]);

  const handleVerificationAttempt = (code: string) => {
    if (lockoutUntil && lockoutUntil > Date.now()) {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      setClientError(`Too many attempts. Please wait ${remaining} seconds.`);
      return;
    }

    const newAttemptCount = attemptCount + 1;
    setAttemptCount(newAttemptCount);

    if (newAttemptCount >= 3) {
      const lockoutTime = Date.now() + 60000;
      setLockoutUntil(lockoutTime);
      setClientError('Too many attempts. Locked for 60 seconds.');
      setOtp(new Array(length).fill(''));
      return;
    }

    setClientError(null);
    onComplete(code);
  };

  // Single handler for all input (typing, autofill, paste) via the hidden input
  const handleHiddenInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLoading) return;
    if (lockoutUntil && lockoutUntil > Date.now()) return;

    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, length);
    const newOtp = new Array(length).fill('');
    for (let i = 0; i < value.length; i++) {
      newOtp[i] = value[i];
    }
    setOtp(newOtp);

    if (value.length === length) {
      handleVerificationAttempt(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isLoading) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      const currentValue = otp.join('');
      if (currentValue.length > 0) {
        const newValue = currentValue.slice(0, -1);
        const newOtp = new Array(length).fill('');
        for (let i = 0; i < newValue.length; i++) {
          newOtp[i] = newValue[i];
        }
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (isLoading) return;

    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length);
    const newOtp = new Array(length).fill('');
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    if (pastedData.length === length) {
      handleVerificationAttempt(pastedData);
    }
  };

  const handleResend = () => {
    if (resendTimer === 0 && onResend) {
      onResend();
      setResendTimer(30);
      setOtp(new Array(length).fill(''));
      hiddenInputRef.current?.focus();
    }
  };

  const focusHiddenInput = () => {
    hiddenInputRef.current?.focus();
  };

  // Which digit box should show the cursor/focus indicator
  const activeIndex = otp.join('').length;
  const isLocked = isLoading || (lockoutUntil !== null && lockoutUntil > Date.now());

  return (
    <div className="flex flex-col items-center space-y-4 relative">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter Verification Code</h2>
        <p className="text-gray-600">
          We sent a {length}-digit code to your phone
          {phoneLastFour && ` ending in ${phoneLastFour}`}
        </p>
      </div>

      {/* Tappable area that focuses the hidden input */}
      <div className="relative" onClick={focusHiddenInput}>
        {/* Hidden input - sole autofill and keyboard target */}
        <input
          ref={hiddenInputRef}
          type="tel"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={length}
          value={otp.join('')}
          onChange={handleHiddenInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={isLocked}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            fontSize: '16px',
            zIndex: 10,
            caretColor: 'transparent',
          }}
          aria-label="Verification code"
        />

        {/* Visual digit boxes (display only) */}
        <div className="flex space-x-2 sm:space-x-3">
          {otp.map((digit, index) => (
            <div
              key={index}
              className={`
                w-12 h-14 sm:w-14 sm:h-16
                flex items-center justify-center
                text-center text-xl font-bold
                border-2 rounded-lg
                transition-all duration-200
                ${error || clientError
                  ? 'border-red-500 bg-red-50'
                  : digit
                    ? 'border-blue-500 bg-blue-50'
                    : isFocused && index === activeIndex
                      ? 'border-blue-500 ring-2 ring-blue-500'
                      : 'border-gray-300'
                }
                ${isLocked ? 'opacity-50' : ''}
              `}
            >
              {digit}
            </div>
          ))}
        </div>
      </div>

      {(error || clientError) && (
        <div className="text-red-600 text-sm mt-2 text-center">
          {clientError || error}
        </div>
      )}

      <div className="text-center mt-4">
        <p className="text-sm text-gray-600 mb-2">
          Didn't receive the code?
        </p>
        <button
          onClick={handleResend}
          disabled={resendTimer > 0 || isLoading}
          className={`
            text-sm font-medium
            ${resendTimer > 0 || isLoading
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-blue-600 hover:text-blue-800 cursor-pointer'
            }
          `}
        >
          {resendTimer > 0
            ? `Resend code in ${resendTimer}s`
            : 'Resend code'
          }
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center mt-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Verifying...</span>
        </div>
      )}
    </div>
  );
};

export default OTPInput;
