/**
 * Retry a function with exponential backoff and jitter.
 *
 * - Retries on network errors (fetch throws) and server errors (5xx).
 * - Does NOT retry on client errors (4xx), since those won't succeed on retry.
 * - Backoff delays: 1s, 2s, 4s (doubling each attempt).
 * - Random jitter of 0-500ms is added to each delay to avoid thundering herd.
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in ms before the first retry (default: 1000) */
  baseDelay?: number;
  /** Called before each retry with the attempt number (1-indexed) and total retries */
  onRetry?: (attempt: number, maxRetries: number, error: Error) => void;
}

/** Error subclass that signals a non-retryable failure (e.g. 4xx). */
export class NonRetryableError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'NonRetryableError';
  }
}

function jitter(): number {
  return Math.random() * 500;
}

function backoffDelay(attempt: number, baseDelay: number): number {
  // attempt is 0-indexed: delays are baseDelay * 2^attempt
  return baseDelay * Math.pow(2, attempt) + jitter();
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
  fn: () => Promise<Response>,
  options: RetryOptions = {},
): Promise<Response> {
  const { maxRetries = 3, baseDelay = 1000, onRetry } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fn();

      // Client errors (4xx) are not retryable
      if (response.status >= 400 && response.status < 500) {
        throw new NonRetryableError(
          `Request failed: ${response.status} ${response.statusText}`,
          response.status,
        );
      }

      // Server errors (5xx) are retryable
      if (response.status >= 500) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      return response;
    } catch (error) {
      // Never retry client errors
      if (error instanceof NonRetryableError) {
        throw error;
      }

      lastError = error instanceof Error ? error : new Error(String(error));

      // If we have retries remaining, wait and try again
      if (attempt < maxRetries) {
        const delay = backoffDelay(attempt, baseDelay);
        if (onRetry) {
          onRetry(attempt + 1, maxRetries, lastError);
        }
        await sleep(delay);
      }
    }
  }

  // All retries exhausted
  throw lastError || new Error('All retry attempts failed');
}
