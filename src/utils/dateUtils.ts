/**
 * Utility functions for handling date-only strings consistently
 * to avoid timezone-related day shifts
 */
import { logger } from '@/utils/logger';

/**
 * Parse a date-only string (YYYY-MM-DD) and return a Date object
 * in local timezone to avoid day shifts
 */
export function parseDateOnly(dateString: string): Date {
  // Split the date string to avoid timezone interpretation issues
  const [year, month, day] = dateString.split('-').map(Number);
  // Create date in local timezone (month is 0-indexed)
  return new Date(year, month - 1, day);
}

/**
 * Format a date-only string consistently for display
 */
export function formatDateOnly(dateString: string): string {
  try {
    const date = parseDateOnly(dateString);
    return date.toLocaleDateString();
  } catch (error) {
    logger.warn('Invalid date string:', dateString);
    return dateString; // Fallback to original string
  }
}

/**
 * Format a date-only string with a specific format using date-fns
 */
export function formatDateOnlyWithFormat(dateString: string, formatString: string): string {
  try {
    const date = parseDateOnly(dateString);
    // Import format from date-fns dynamically to avoid issues if not available
    const { format } = require('date-fns');
    return format(date, formatString);
  } catch (error) {
    logger.warn('Error formatting date:', dateString, error);
    return dateString; // Fallback to original string
  }
}