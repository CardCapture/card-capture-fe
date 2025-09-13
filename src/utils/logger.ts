/**
 * Environment-aware logging utility
 * Only logs in development mode to keep production console clean
 */

const isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },

  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  warn: (...args: any[]) => {
    // Always show warnings
    console.warn(...args);
  },

  error: (...args: any[]) => {
    // Always show errors
    console.error(...args);
  }
};