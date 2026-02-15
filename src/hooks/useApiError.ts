import { useCallback } from "react";
import { toast } from "@/lib/toast";
import { ApiError } from "@/lib/apiError";

/**
 * Hook that returns a `handleError` function for consistent error handling.
 *
 * Usage:
 *   const { handleError } = useApiError();
 *   try { ... } catch (err) { handleError(err); }
 *
 * If the error is an ApiError it shows a status-appropriate toast.
 * Otherwise it shows a generic message.
 */
export function useApiError() {
  const handleError = useCallback((error: unknown) => {
    if (error instanceof ApiError) {
      switch (error.status) {
        case 401:
          toast.sessionExpired();
          break;
        case 403:
          toast.error("You don't have permission to do this", "Forbidden");
          break;
        case 404:
          toast.error("Resource not found", "Not Found");
          break;
        case 429:
          toast.warning("Too many requests, please slow down", "Rate Limited");
          break;
        default:
          if (error.isServerError) {
            toast.error("Something went wrong. Our team has been notified.", "Server Error");
          } else {
            toast.error(error.detail || "Request failed", "Error");
          }
          break;
      }
      return;
    }

    // Non-ApiError (network failures, unexpected throws, etc.)
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    toast.error(message, "Error");
  }, []);

  return { handleError };
}
