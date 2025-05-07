import { useAuth } from "@/contexts/AuthContext";

export async function authFetch(input: RequestInfo, init: RequestInit = {}, token?: string) {
  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
} 