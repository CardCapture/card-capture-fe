import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check, AlertCircle, Calendar } from 'lucide-react';

interface SmartDateInputProps {
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

export function SmartDateInput({ 
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
}: SmartDateInputProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [touched, setTouched] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayError = error || internalError;
  const isValid = touched && !displayError && success;

  // Format date as MM/DD/YYYY
  const formatDate = (input: string): string => {
    // Remove all non-digits
    const digits = input.replace(/\D/g, '');
    
    // Format as MM/DD/YYYY
    if (digits.length >= 8) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    } else if (digits.length >= 4) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length >= 2) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  // Convert 2-digit year to 4-digit
  const expandYear = (yy: number): number => {
    const currentYear = new Date().getFullYear();
    const cutoff = (currentYear % 100) + 1;
    return yy + (yy < cutoff ? 2000 : 1900);
  };

  // Convert display format to ISO format (YYYY-MM-DD)
  const toISODate = (formattedDate: string): string => {
    // Match MM/DD/YYYY (4-digit year)
    const match4 = formattedDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match4) {
      const [, month, day, year] = match4;
      return `${year}-${month}-${day}`;
    }
    // Match MM/DD/YY (2-digit year)
    const match2 = formattedDate.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
    if (match2) {
      const [, month, day, yy] = match2;
      const fullYear = expandYear(parseInt(yy, 10));
      return `${fullYear}-${month}-${day}`;
    }
    return '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatDate(inputValue);
    
    setDisplayValue(formatted);
    
    // Only call onChange with ISO format if we have a complete date
    // Length 10 = MM/DD/YYYY, length 8 = MM/DD/YY
    const isoDate = toISODate(formatted);
    if (isoDate) {
      onChange(isoDate);
    } else {
      onChange('');
    }

    // Clear validation error when user starts typing
    if (touched && internalError) {
      setInternalError(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const cursorPosition = input.selectionStart || 0;
    const currentValue = displayValue;

    // Handle backspace specifically to skip over separators
    if (e.key === 'Backspace') {
      // If cursor is right after a separator, move cursor before separator and delete the digit
      if (cursorPosition > 0 && currentValue[cursorPosition - 1] === '/') {
        e.preventDefault();
        
        // Find the digit before the separator and remove it
        if (cursorPosition >= 2) {
          const newValue = currentValue.slice(0, cursorPosition - 2) + currentValue.slice(cursorPosition);
          const formatted = formatDate(newValue);
          setDisplayValue(formatted);
          
          // Update parent
          const isoDate = toISODate(formatted);
          if (isoDate) {
            onChange(isoDate);
          } else {
            onChange('');
          }
          
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

    // Allow: backspace, delete, tab, escape, enter, arrows
    if ([8, 9, 27, 13, 46, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true)) {
      return;
    }
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  const handleBlur = () => {
    setTouched(true);
    
    if (onValidate && displayValue) {
      const isoDate = toISODate(displayValue);
      const validationError = onValidate(isoDate);
      setInternalError(validationError);
    }
  };


  // Update display value when prop value changes
  useEffect(() => {
    if (value && value !== toISODate(displayValue)) {
      // Convert ISO date to display format
      const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (match) {
        const [, year, month, day] = match;
        setDisplayValue(`${month}/${day}/${year}`);
      }
    }
  }, [value]);

  return (
    <div className="space-y-2">
      <label 
        htmlFor={`date-input-${label.replace(/\s+/g, '-').toLowerCase()}`}
        className="block text-sm font-medium text-gray-900"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          ref={inputRef}
          id={`date-input-${label.replace(/\s+/g, '-').toLowerCase()}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="MM/DD/YYYY"
          maxLength={10}
          autoComplete="bday"
          className={cn(
            "w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200",
            "text-base", // Prevent zoom on iOS
            displayError && "border-red-500 focus:ring-red-500 focus:border-red-500",
            isValid && "border-green-500 focus:ring-green-500 focus:border-green-500 pr-10",
            className
          )}
          {...props}
        />
        
        {/* Calendar icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {isValid ? (
            <Check className="h-5 w-5 text-green-500" />
          ) : displayError ? (
            <AlertCircle className="h-5 w-5 text-red-500" />
          ) : (
            <Calendar className="h-5 w-5 text-gray-400" />
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