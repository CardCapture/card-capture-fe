import { supabase } from "@/lib/supabaseClient";

export async function authFetch(
  input: RequestInfo,
  init: RequestInit = {},
  token?: string
) {
  const headers = new Headers(init.headers || {});

  // Use provided token, or get from Supabase session
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
    credentials: 'include'
  });
}
