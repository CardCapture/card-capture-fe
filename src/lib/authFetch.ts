import { supabase } from "@/lib/supabaseClient";
import { ApiError } from "@/lib/apiError";

/**
 * Authenticated fetch wrapper.
 *
 * - Attaches the current Supabase access token (or a provided token).
 * - On 401: attempts a single token refresh and retries the request.
 *   If the refresh fails, clears the session and redirects to /login.
 * - On any other non-ok response: throws an ApiError so callers always
 *   receive either a successful Response or a structured error.
 */
export async function authFetch(
  input: RequestInfo,
  init: RequestInit = {},
  token?: string
): Promise<Response> {
  const response = await _doFetch(input, init, token);

  // Handle 401 with a single refresh-and-retry attempt.
  if (response.status === 401) {
    const { data, error } = await supabase.auth.refreshSession();

    if (error || !data.session) {
      await supabase.auth.signOut();
      window.location.href = "/login";
      throw new ApiError(401, "Session expired, please log in again");
    }

    // Retry with the new token.
    const retryResponse = await _doFetch(input, init, data.session.access_token);

    if (!retryResponse.ok) {
      throw await ApiError.fromResponse(retryResponse);
    }

    return retryResponse;
  }

  if (!response.ok) {
    throw await ApiError.fromResponse(response);
  }

  return response;
}

/**
 * Internal helper that builds headers and performs the actual fetch.
 */
async function _doFetch(
  input: RequestInfo,
  init: RequestInit,
  token?: string
): Promise<Response> {
  const headers = new Headers(init.headers || {});

  let authToken = token;
  if (!authToken) {
    const { data: { session } } = await supabase.auth.getSession();
    authToken = session?.access_token;
  }

  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: "include",
  });
}
