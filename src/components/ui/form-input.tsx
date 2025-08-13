import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check, AlertCircle } from 'lucide-react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  success?: boolean;
  onValidate?: (value: string) => string | null;
  helpText?: string;
}

export function FormInput({ 
  label, 
  error, 
  success, 
  onValidate, 
  helpText,
  className,
  onBlur,
  onChange,
  ...props 
}: FormInputProps) {
  const [internalError, setInternalError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayError = error || internalError;
  const isValid = touched && !displayError && success;

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);
    
    if (onValidate) {
      const validationError = onValidate(e.target.value);
      setInternalError(validationError);
    }
    
    onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Clear validation error when user starts typing
    if (touched && internalError) {
      setInternalError(null);
    }
    onChange?.(e);
  };

  return (
    <div className="space-y-2">
      <label 
        htmlFor={props.id || props.name}
        className="block text-sm font-medium text-gray-900"
      >
        {label}
        {props.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          ref={inputRef}
          {...props}
          className={cn(
            "w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200",
            "text-base", // Prevent zoom on iOS
            displayError && "border-red-500 focus:ring-red-500 focus:border-red-500",
            isValid && "border-green-500 focus:ring-green-500 focus:border-green-500 pr-10",
            className
          )}
          onBlur={handleBlur}
          onChange={handleChange}
        />
        
        {/* Success checkmark */}
        {isValid && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <Check className="h-5 w-5 text-green-500" />
          </div>
        )}
        
        {/* Error icon */}
        {displayError && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
        )}
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