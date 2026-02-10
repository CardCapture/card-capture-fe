import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check, AlertCircle, Phone } from 'lucide-react';

interface SmartPhoneInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  success?: boolean;
  onValidate?: (value: string) => string | null;
  helpText?: string;
  className?: string;
  required?: boolean;
}

export function SmartPhoneInput({ 
  label, 
  value, 
  onChange, 
  error, 
  success, 
  onValidate, 
  helpText,
  className,
  required = false,
  ...props 
}: SmartPhoneInputProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [touched, setTouched] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayError = error || internalError;
  const isValid = touched && !displayError && success;

  // Format phone as XXX-XXX-XXXX
  const formatPhone = (input: string): string => {
    // Remove all non-digits, strip leading '1' country code if 11 digits
    let digits = input.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('1')) {
      digits = digits.slice(1);
    }
    digits = digits.slice(0, 10);
    
    // Apply formatting
    if (digits.length >= 6) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length >= 3) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    return digits;
  };

  // Convert formatted phone to clean digits for storage
  const toCleanPhone = (formattedPhone: string): string => {
    const digits = formattedPhone.replace(/\D/g, '');
    // Always return just the digits for storage
    return digits;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;
    
    // Extract only digits, strip leading '1' country code if 11 digits
    let digits = input.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('1')) {
      digits = digits.slice(1);
    }
    digits = digits.slice(0, 10);
    const formatted = formatPhone(digits);
    
    setDisplayValue(formatted);
    
    // Call onChange with clean format for storage
    const cleanPhone = toCleanPhone(formatted);
    onChange(cleanPhone);

    // For regular typing (not backspace), maintain cursor position
    setTimeout(() => {
      if (inputRef.current) {
        // Count how many digits we've typed
        const digitsBefore = input.slice(0, cursorPosition).replace(/\D/g, '').length;
        
        // Find the position after the same number of digits in formatted value
        let digitCount = 0;
        let newCursorPos = formatted.length;
        for (let i = 0; i < formatted.length; i++) {
          if (/\d/.test(formatted[i])) {
            digitCount++;
            if (digitCount >= digitsBefore) {
              newCursorPos = i + 1;
              break;
            }
          }
        }
        
        // Don't place cursor on a dash
        if (formatted[newCursorPos] === '-') {
          newCursorPos++;
        }
        
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);

    // Clear validation error when user starts typing
    if (touched && internalError) {
      setInternalError(null);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    
    if (onValidate && displayValue) {
      const cleanPhone = toCleanPhone(displayValue);
      const validationError = onValidate(cleanPhone);
      setInternalError(validationError);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const cursorPosition = input.selectionStart || 0;
    const currentValue = displayValue;

    // Handle backspace specifically to skip over separators
    if (e.key === 'Backspace') {
      // If cursor is right after a dash, skip over it and delete the digit before
      if (cursorPosition > 0 && currentValue[cursorPosition - 1] === '-') {
        e.preventDefault();
        
        // Find the digit before the dash and remove it
        if (cursorPosition >= 2) {
          const newValue = currentValue.slice(0, cursorPosition - 2) + currentValue.slice(cursorPosition);
          const digits = newValue.replace(/\D/g, '');
          const formatted = formatPhone(digits);
          setDisplayValue(formatted);
          
          // Update parent
          const cleanPhone = toCleanPhone(formatted);
          onChange(cleanPhone);
          
          // Position cursor after the deletion
          setTimeout(() => {
            if (inputRef.current) {
              const newPos = Math.max(0, cursorPosition - 2);
              inputRef.current.setSelectionRange(newPos, newPos);
            }
          }, 0);
        }
        return;
      }
    }

    // Allow: backspace, delete, tab, escape, enter, arrows, home, end
    if ([8, 9, 27, 13, 46, 37, 38, 39, 40, 35, 36].indexOf(e.keyCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
        (e.ctrlKey && [65, 67, 86, 88, 90].indexOf(e.keyCode) !== -1)) {
      return;
    }
    
    // Only allow digits
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  // Update display value when prop value changes
  useEffect(() => {
    if (value) {
      // Convert stored phone format to display format
      const digits = value.replace(/\D/g, '');
      setDisplayValue(formatPhone(digits));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  return (
    <div className="space-y-2">
      <label 
        htmlFor={`phone-input-${label.replace(/\s+/g, '-').toLowerCase()}`}
        className="block text-sm font-medium text-gray-900"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          ref={inputRef}
          id={`phone-input-${label.replace(/\s+/g, '-').toLowerCase()}`}
          type="tel"
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Your mobile number"
          maxLength={12}
          autoComplete="tel"
          className={cn(
            "w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200",
            "text-base", // Prevent zoom on iOS
            displayError && "border-red-500 focus:ring-red-500 focus:border-red-500",
            isValid && "border-green-500 focus:ring-green-500 focus:border-green-500 pr-10",
            className
          )}
          {...props}
        />
        
        {/* Phone icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {isValid ? (
            <Check className="h-5 w-5 text-green-500" />
          ) : displayError ? (
            <AlertCircle className="h-5 w-5 text-red-500" />
          ) : (
            <Phone className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>
      
      {/* Error message */}
      {displayError && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {displayError}
        </p>
      )}
      
      {/* Help text */}
      {helpText && !displayError && (
        <p className="text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  );
}