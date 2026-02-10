import React, { useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function DateInput({
  value,
  onChange,
  className,
  ...props
}: DateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Convert ISO date (YYYY-MM-DD) to MM/DD/YYYY before formatting
  const normalizeInput = (input: string): string => {
    const isoMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return `${month}/${day}/${year}`;
    }
    return input;
  };

  // Format the date as MM/DD/YYYY
  const formatDate = (input: string) => {
    const normalized = normalizeInput(input);
    // Remove all non-numeric characters
    const cleaned = normalized.replace(/\D/g, '');

    // Apply formatting based on length
    if (cleaned.length <= 2) {
      return cleaned;
    } else if (cleaned.length <= 4) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    } else {
      // Limit to 8 digits and format as MM/DD/YYYY
      const truncated = cleaned.slice(0, 8);
      return `${truncated.slice(0, 2)}/${truncated.slice(2, 4)}/${truncated.slice(4)}`;
    }
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
    const oldFormatted = formatDate(value);
    const newFormatted = formatDate(inputValue);
    
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
      type="text"
      inputMode="numeric"
      value={formatDate(value)}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder="MM/DD/YYYY"
      className={cn(className)}
      {...props}
    />
  );
} 