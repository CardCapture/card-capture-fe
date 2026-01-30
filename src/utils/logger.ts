/**
 * Environment-aware logging utility
 * Only logs in development mode to keep production console clean
 *
 * Usage:
 *   import { logger } from '@/utils/logger';
 *   logger.log('Message');
 *   logger.debug('auth', 'User logged in');
 *   logger.error('api', 'Request failed', error);
 */

const isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Log a message (development only)
   * @param serviceOrMessage - Service name or first message argument
   * @param args - Additional arguments
   */
  log: (serviceOrMessage: string, ...args: unknown[]) => {
    if (isDevelopment) {
      // If args is empty, serviceOrMessage is the only argument
      if (args.length === 0) {
        console.log(serviceOrMessage);
      } else {
        console.log(`[${serviceOrMessage}]`, ...args);
      }
    }
  },

  /**
   * Log a debug message (development only)
   */
  debug: (serviceOrMessage: string, ...args: unknown[]) => {
    if (isDevelopment) {
      if (args.length === 0) {
        console.log('[DEBUG]', serviceOrMessage);
      } else {
        console.log(`[DEBUG][${serviceOrMessage}]`, ...args);
      }
    }
  },

  /**
   * Log an info message (development only)
   */
  info: (serviceOrMessage: string, ...args: unknown[]) => {
    if (isDevelopment) {
      if (args.length === 0) {
        console.info(serviceOrMessage);
      } else {
        console.info(`[${serviceOrMessage}]`, ...args);
      }
    }
  },

  /**
   * Log a warning (always shown)
   */
  warn: (serviceOrMessage: string, ...args: unknown[]) => {
    if (args.length === 0) {
      console.warn(serviceOrMessage);
    } else {
      console.warn(`[${serviceOrMessage}]`, ...args);
    }
  },

  /**
   * Log an error (always shown)
   */
  error: (serviceOrMessage: string, ...args: unknown[]) => {
    if (args.length === 0) {
      console.error(serviceOrMessage);
    } else {
      console.error(`[${serviceOrMessage}]`, ...args);
    }
  }
};
