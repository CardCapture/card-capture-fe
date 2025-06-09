// Get session from localStorage to avoid React hooks restrictions
function getStoredSession() {
  try {
    const storedSession = localStorage.getItem("supabase.auth.token");
    if (storedSession) {
      const session = JSON.parse(storedSession);
      return session?.access_token;
    }
  } catch (error) {
    console.warn("Failed to get stored session:", error);
  }
  return null;
}

export async function authFetch(
  input: RequestInfo,
  init: RequestInit = {},
  token?: string
) {
  const headers = new Headers(init.headers || {});

  // Use provided token, or fallback to stored session token
  const authToken = token || getStoredSession();

  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  return fetch(input, { ...init, headers });
}
