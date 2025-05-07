// src/lib/utils.ts

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// --- Existing Utility ---

/**
 * Combines class names using clsx and merges Tailwind CSS classes without conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- New Dashboard Helper Functions ---

/**
 * Formats a phone number string into (XXX) XXX-XXXX or XXX-XXXX.
 * Returns the original string if it doesn't match the expected formats or is empty/null.
 */
export const formatPhoneNumber = (phoneStr: string | null | undefined): string => {
  if (!phoneStr) return '';
  const cleaned = ('' + phoneStr).replace(/\D/g, ''); // Remove non-digit characters

  // Match 10-digit numbers (e.g., 1234567890)
  const match10 = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match10) {
    return `(${match10[1]}) ${match10[2]}-${match10[3]}`;
  }

  // Match 7-digit numbers (e.g., 4567890) - Less common for full numbers but might occur
  const match7 = cleaned.match(/^(\d{3})(\d{4})$/);
  if (match7) {
    return `${match7[1]}-${match7[2]}`;
  }

  // Return the original input if it doesn't match standard formats
  // or if it was something else entirely (e.g., "+1 (123) ...")
  return phoneStr;
};

/**
 * Formats a date string into MM/DD/YYYY, handling potential 'NA' or invalid dates.
 * Attempts to correct 2-digit years, assuming context relevant to common birth years.
 * Returns an empty string for invalid inputs or formatting errors.
 */
export const formatBirthday = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';

  // Handle common non-date strings explicitly before attempting parsing
  const trimmedUpper = dateStr.trim().toUpperCase();
  if (trimmedUpper === 'NA' || trimmedUpper === '') {
    return '';
  }

  try {
    // Handle month names (e.g., "April")
    const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
    const monthIndex = months.indexOf(trimmedUpper);
    if (monthIndex !== -1) {
      // If only month is provided, return it formatted
      return `${monthIndex + 1}/DD/YYYY`;
    }

    // Standardize potential separators to '/'
    const standardizedDateStr = dateStr.replace(/[-\.]/g, '/');

    // Try to parse the date
    const date = new Date(standardizedDateStr);

    // Check if the date parsing resulted in a valid date object
    if (isNaN(date.getTime())) {
      // If not a valid date, try to extract month/day/year parts
      const parts = standardizedDateStr.split('/');
      if (parts.length >= 2) {
        const month = parseInt(parts[0]);
        const day = parseInt(parts[1]);
        const year = parts[2] ? parseInt(parts[2]) : null;

        // Validate month and day
        if (month >= 1 && month <= 12) {
          if (day >= 1 && day <= 31) {
            return year ? 
              `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}` :
              `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/YYYY`;
          }
          return `${month.toString().padStart(2, '0')}/DD/YYYY`;
        }
      }
      
      console.warn("Invalid date string for birthday:", dateStr);
      return dateStr; // Return original string if we can't parse it
    }

    // Handle potential 2-digit year inputs
    let year = date.getFullYear();
    if (year >= 0 && year <= 99) {
      const currentYear = new Date().getFullYear();
      const cutoff = (currentYear % 100) + 1;
      year += (year < cutoff) ? 2000 : 1900;
      date.setFullYear(year);
    }

    // Format the valid date
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

  } catch (e) {
    console.warn("Error formatting birthday:", dateStr, e);
    return dateStr; // Return original string on error
  }
};


/**
 * Escapes a value for CSV format, handling commas, double quotes, and newlines.
 * Wraps the value in double quotes if necessary and escapes existing double quotes.
 * Null or undefined values become empty strings.
 */
export const escapeCsvValue = (value: any): string => {
  const stringValue = value === null || typeof value === 'undefined' ? '' : String(value);

  // Check if escaping is needed (contains comma, double quote, or newline)
  if (/[",\n]/.test(stringValue)) {
    // Replace existing double quotes with two double quotes, then wrap the whole string in double quotes.
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  // Return the original string value if no escaping is needed.
  return stringValue;
};

/**
 * Formats a date string into a numeric MM/DD/YYYY format (e.g., 4/6/2025).
 * Returns an empty string if the input is null, undefined, or an invalid date string.
 */
export const formatDateOrTimeAgo = (dateStr: string | null | undefined): string => {
    // Note: The original function name mentioned "Time Ago", but the implementation only formats the date.
    // Consider renaming to `formatDateNumeric` or similar if "time ago" functionality isn't planned.
    if (!dateStr) return '';

    try {
        const date = new Date(dateStr);
        // Check if the date is valid after parsing
        if (isNaN(date.getTime())) {
            console.warn("Invalid date string for formatting:", dateStr);
            return '';
        }
        // Format to locale string (e.g., "4/6/2025" in en-US)
        return date.toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric',
        });
    } catch (e) {
        console.warn("Error formatting date:", dateStr, e);
        return ''; // Return empty string on error
    }
};