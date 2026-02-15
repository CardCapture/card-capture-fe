/**
 * Structured error class for API responses.
 *
 * Thrown by authFetch on non-ok responses so callers always receive
 * either a successful Response or a typed ApiError.
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly detail: string;
  public readonly isAuthError: boolean;
  public readonly isServerError: boolean;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
    this.isAuthError = status === 401 || status === 403;
    this.isServerError = status >= 500;
  }

  /**
   * Parse an error from a fetch Response.
   *
   * The backend returns errors as `{ error: string, detail?: string }`.
   * Falls back to the HTTP status text when the body cannot be parsed.
   */
  static async fromResponse(response: Response, body?: unknown): Promise<ApiError> {
    let parsed = body;

    if (!parsed) {
      try {
        parsed = await response.clone().json();
      } catch {
        // Body is not JSON or already consumed; fall through.
      }
    }

    let detail: string;

    if (parsed && typeof parsed === "object") {
      const obj = parsed as Record<string, unknown>;
      detail =
        (typeof obj.detail === "string" ? obj.detail : undefined) ??
        (typeof obj.error === "string" ? obj.error : undefined) ??
        response.statusText;
    } else {
      detail = response.statusText || `Request failed with status ${response.status}`;
    }

    return new ApiError(response.status, detail);
  }
}
