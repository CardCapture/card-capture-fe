import React from "react";
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
    const newValue = e.target.value;
    // Only format if we have a value
    const formatted = newValue ? formatPhoneNumber(newValue) : '';
    onChange(formatted);
  };

  // Format the initial value if it exists
  const displayValue = value ? formatPhoneNumber(value) : '';

  return (
    <Input
      type="tel"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      className={cn(className)}
      {...props}
    />
  );
} 