import React, { useRef, useEffect } from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface PhoneNumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function PhoneNumberInput({
  value,
  onChange,
  className,
  ...props
}: PhoneNumberInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Format the phone number as the user types
  const formatPhoneNumber = (input: string) => {
    // Remove all non-numeric characters
    const cleaned = input.replace(/\D/g, '');
    
    // Limit to 10 digits
    const truncated = cleaned.slice(0, 10);
    
    // Format the number with hyphens
    const parts = [];
    if (truncated.length > 0) parts.push(truncated.slice(0, 3));
    if (truncated.length > 3) parts.push(truncated.slice(3, 6));
    if (truncated.length > 6) parts.push(truncated.slice(6));
    
    return parts.join('-');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const oldValue = input.value;
    const newValue = e.target.value;
    
    // Only format if we have a value
    const formatted = newValue ? formatPhoneNumber(newValue) : '';
    
    // Calculate cursor position adjustment
    let newCursorPos = start;
    if (start === end) { // Only adjust if there's no selection
      const oldFormatted = formatPhoneNumber(oldValue);
      const oldDigits = oldValue.replace(/\D/g, '');
      const newDigits = newValue.replace(/\D/g, '');
      
      // If we're adding a digit
      if (newDigits.length > oldDigits.length) {
        // Count hyphens before cursor in old and new formatted values
        const oldHyphensBeforeCursor = (oldFormatted.slice(0, start).match(/-/g) || []).length;
        const newHyphensBeforeCursor = (formatted.slice(0, start).match(/-/g) || []).length;
        newCursorPos = start + (newHyphensBeforeCursor - oldHyphensBeforeCursor);
      }
      // If we're removing a digit
      else if (newDigits.length < oldDigits.length) {
        // Count hyphens before cursor in old and new formatted values
        const oldHyphensBeforeCursor = (oldFormatted.slice(0, start).match(/-/g) || []).length;
        const newHyphensBeforeCursor = (formatted.slice(0, start).match(/-/g) || []).length;
        newCursorPos = start - (oldHyphensBeforeCursor - newHyphensBeforeCursor);
      }
    }
    
    onChange(formatted);
    
    // Restore cursor position after React re-render
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    });
  };

  // Format the initial value if it exists
  const displayValue = value ? formatPhoneNumber(value) : '';

  return (
    <Input
      ref={inputRef}
      type="tel"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      className={cn(className)}
      {...props}
    />
  );
} 