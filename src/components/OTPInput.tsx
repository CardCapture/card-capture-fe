import React, { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';

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
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);
  
  useEffect(() => {
    // Add input event listeners to detect auto-fill
    const handleInput = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const index = inputRefs.current.findIndex(ref => ref === target);
      if (index !== -1 && target.value.length > 1) {
        // This is likely auto-fill, handle it as multi-character input
        handleChange(index, target.value);
        // Clear the input to prevent display issues
        target.value = '';
      }
    };
    
    inputRefs.current.forEach(input => {
      if (input) {
        input.addEventListener('input', handleInput);
      }
    });
    
    return () => {
      inputRefs.current.forEach(input => {
        if (input) {
          input.removeEventListener('input', handleInput);
        }
      });
    };
  }, [otp]); // Add otp dependency to recreate listeners when state changes

  useEffect(() => {
    // Start resend timer
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (index: number, value: string) => {
    if (isLoading) return;
    
    // Handle multi-character input (like auto-fill or paste)
    const digits = value.replace(/[^0-9]/g, '');
    
    if (digits.length > 1) {
      // Multiple digits - treat as auto-fill or paste
      const newOtp = [...otp];
      
      // Fill from current index onwards
      for (let i = 0; i < digits.length && (index + i) < length; i++) {
        newOtp[index + i] = digits[i];
      }
      
      setOtp(newOtp);
      
      // Focus the next empty input or last input
      const nextEmptyIndex = newOtp.findIndex((val, idx) => idx > index && val === '');
      const focusIndex = nextEmptyIndex === -1 ? Math.min(index + digits.length, length - 1) : nextEmptyIndex;
      inputRefs.current[focusIndex]?.focus();
      
      // Auto-submit if complete
      const otpString = newOtp.join('');
      if (otpString.length === length) {
        onComplete(otpString);
      }
    } else {
      // Single digit
      const digit = digits.slice(-1);
      
      const newOtp = [...otp];
      newOtp[index] = digit;
      setOtp(newOtp);

      // Move to next input if digit was entered
      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      // Check if all digits are filled
      const otpString = newOtp.join('');
      if (otpString.length === length) {
        onComplete(otpString);
      }
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (isLoading) return;
    
    // Handle backspace
    if (e.key === 'Backspace') {
      e.preventDefault();
      
      const newOtp = [...otp];
      
      if (otp[index]) {
        // Clear current input
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        // Move to previous input and clear it
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }
    
    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (isLoading) return;
    
    // Get the current input index
    const currentIndex = inputRefs.current.findIndex(ref => ref === e.target);
    
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length);
    const newOtp = [...otp];
    
    // Always fill from the beginning for pasted data (more intuitive)
    for (let i = 0; i < pastedData.length && i < length; i++) {
      newOtp[i] = pastedData[i];
    }
    
    setOtp(newOtp);
    
    // Focus the next empty input or the last input
    const nextEmptyIndex = newOtp.findIndex(val => val === '');
    const focusIndex = nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
    
    // Auto-submit if complete
    if (pastedData.length === length) {
      onComplete(pastedData);
    }
  };

  const handleResend = () => {
    if (resendTimer === 0 && onResend) {
      onResend();
      setResendTimer(30);
      setOtp(new Array(length).fill(''));
      inputRefs.current[0]?.focus();
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter Verification Code</h2>
        <p className="text-gray-600">
          We sent a {length}-digit code to your phone
          {phoneLastFour && ` ending in ${phoneLastFour}`}
        </p>
      </div>

      {/* Hidden input for iOS auto-fill detection */}
      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        style={{
          position: 'absolute',
          left: '-9999px',
          opacity: 0,
          pointerEvents: 'none'
        }}
        onChange={(e) => {
          const value = e.target.value.replace(/[^0-9]/g, '').slice(0, length);
          if (value.length > 0) {
            const newOtp = new Array(length).fill('');
            for (let i = 0; i < value.length; i++) {
              newOtp[i] = value[i];
            }
            setOtp(newOtp);
            
            if (value.length === length) {
              onComplete(value);
            } else {
              // Focus the next empty input
              const nextIndex = value.length < length ? value.length : length - 1;
              inputRefs.current[nextIndex]?.focus();
            }
            
            // Clear the hidden input
            e.target.value = '';
          }
        }}
      />

      <div className="flex space-x-2 sm:space-x-3">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={el => inputRefs.current[index] = el}
            type="text"
            inputMode="numeric"
            pattern="[0-9]"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={isLoading}
            className={`
              w-12 h-14 sm:w-14 sm:h-16
              text-center text-xl font-bold
              border-2 rounded-lg
              transition-all duration-200
              ${error 
                ? 'border-red-500 bg-red-50' 
                : digit 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            `}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        ))}
      </div>

      {error && (
        <div className="text-red-600 text-sm mt-2 text-center">
          {error}
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