import React, { useRef } from "react";
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    const cursorPosition = input.selectionStart || 0;
    
    // Handle backspace at the beginning of input
    if (e.key === 'Backspace' && cursorPosition === 0) {
      e.preventDefault();
      return;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const cursorPosition = input.selectionStart || 0;
    const inputValue = e.target.value;
    
    // Get the old formatted value to compare
    const oldFormatted = formatPhoneNumber(value);
    const newFormatted = formatPhoneNumber(inputValue);
    
    // If the formatted value didn't actually change, don't update
    if (oldFormatted === newFormatted) {
      return;
    }
    
    // Count digits before cursor in the input
    const digitsBeforeCursor = inputValue.slice(0, cursorPosition).replace(/\D/g, '').length;
    
    // Update the value
    onChange(newFormatted);
    
    // Calculate new cursor position after formatting
    setTimeout(() => {
      if (inputRef.current) {
        let targetPosition = 0;
        let digitCount = 0;
        
        // Find position after the same number of digits
        for (let i = 0; i < newFormatted.length; i++) {
          if (/\d/.test(newFormatted[i])) {
            digitCount++;
            if (digitCount === digitsBeforeCursor) {
              targetPosition = i + 1;
              break;
            }
          }
        }
        
        // If we didn't find the right position, keep cursor at beginning
        if (targetPosition === 0 && digitsBeforeCursor > 0) {
          targetPosition = newFormatted.length;
        }
        
        inputRef.current.setSelectionRange(targetPosition, targetPosition);
      }
    }, 0);
  };

  return (
    <Input
      ref={inputRef}
      type="tel"
      inputMode="numeric"
      value={formatPhoneNumber(value)}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className={cn(className)}
      {...props}
    />
  );
} 