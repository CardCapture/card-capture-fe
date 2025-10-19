// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useMemo,
  useCallback,
  useRef,
} from "react";
// Add SignInWithPasswordCredentials import
import {
  Session,
  User,
  SignInWithPasswordCredentials,
} from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

// Profile cache configuration
const PROFILE_CACHE_KEY = 'user_profile_cache';
const PROFILE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Enhanced types for permissions
interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: ("admin" | "recruiter" | "reviewer")[];
  school_id: string | null; // Allow null for SuperAdmins
  mfa_verified_at: string | null; // Track MFA verification for session
}

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  // --- Add Function Signature ---
  signInWithPassword: (
    credentials: SignInWithPasswordCredentials
  ) => Promise<{ error: Error | null }>;
  refetchProfile: (forceRefresh?: boolean) => Promise<void>;
  clearProfileCache: (userId?: string) => void;
  // --- End Add ---
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Track previous session to prevent redundant fetches
  const prevSessionRef = useRef<Session | null>(null);

  // Helper to get cached profile
  const getCachedProfile = useCallback((userId: string): UserProfile | null => {
    try {
      const cached = localStorage.getItem(`${PROFILE_CACHE_KEY}_${userId}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < PROFILE_CACHE_TTL) {
          console.log("DEBUG: Using cached profile for user:", userId);
          return data;
        }
        console.log("DEBUG: Cache expired for user:", userId);
      }
    } catch (error) {
      console.error("Error reading profile cache:", error);
    }
    return null;
  }, []);

  // Helper to cache profile
  const cacheProfile = useCallback((userId: string, profileData: UserProfile) => {
    try {
      localStorage.setItem(
        `${PROFILE_CACHE_KEY}_${userId}`,
        JSON.stringify({
          data: profileData,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error("Error caching profile:", error);
    }
  }, []);

  // Helper to clear profile cache
  const clearProfileCache = useCallback((userId?: string) => {
    try {
      if (userId) {
        localStorage.removeItem(`${PROFILE_CACHE_KEY}_${userId}`);
      } else {
        // Clear all profile caches
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (key.startsWith(PROFILE_CACHE_KEY)) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (error) {
      console.error("Error clearing profile cache:", error);
    }
  }, []);

  // Refetch profile function that can be called from outside
  // Set forceRefresh=true to bypass cache (e.g., after MFA verification)
  const refetchProfile = useCallback(async (forceRefresh: boolean = false) => {
    const currentSession = await supabase.auth.getSession();
    const userId = currentSession.data.session?.user?.id;

    if (!userId) {
      setProfile(null);
      clearProfileCache();
      return;
    }

    console.log("DEBUG: Refetching profile for user:", userId, "forceRefresh:", forceRefresh);

    // Check cache first (unless forceRefresh is true)
    if (!forceRefresh) {
      const cachedProfile = getCachedProfile(userId);
      if (cachedProfile) {
        setProfile(cachedProfile);
        return;
      }
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name, role, school_id, mfa_verified_at")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        console.error("Profile fetch error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        setProfile(null);
        return;
      }

      console.log("DEBUG: Profile refetched:", data);
      setProfile(data);
      cacheProfile(userId, data);
    } catch (error) {
      console.error("Error in refetchProfile:", error);
      setProfile(null);
    }
  }, [getCachedProfile, cacheProfile, clearProfileCache]);

  // Fetch user profile when session changes (with caching and deduplication)
  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user?.id) {
        setProfile(null);
        clearProfileCache();
        prevSessionRef.current = null;
        return;
      }

      // Skip fetch if session hasn't actually changed (prevents redundant calls)
      if (
        prevSessionRef.current?.user?.id === session.user.id &&
        prevSessionRef.current?.access_token === session.access_token
      ) {
        console.log("DEBUG: Session unchanged, skipping profile fetch");
        return;
      }

      prevSessionRef.current = session;

      console.log("DEBUG: Fetching profile for user:", session.user.id);
      console.log("DEBUG: User metadata:", session.user.user_metadata);
      console.log("DEBUG: App metadata:", session.user.app_metadata);

      // Try cache first
      const cachedProfile = getCachedProfile(session.user.id);
      if (cachedProfile) {
        setProfile(cachedProfile);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, email, first_name, last_name, role, school_id, mfa_verified_at")
          .eq("id", session.user.id)
          .single();

        if (error) {
          console.error("Error fetching user profile:", error);
          console.error("Profile fetch error details:", {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          });
          setProfile(null);
          return;
        }

        console.log("DEBUG: Profile found:", data);
        setProfile(data);
        cacheProfile(session.user.id, data);
      } catch (error) {
        console.error("Error in fetchProfile:", error);
        setProfile(null);
      }
    };

    fetchProfile();
  }, [session, getCachedProfile, cacheProfile, clearProfileCache]);

  useEffect(() => {
    setLoading(true);
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error getting initial session:", error);
        setLoading(false);
      });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log("Auth state changed:", _event, session);
        console.log("Setting session:", !!session, "user:", !!session?.user);
        setSession(session);
        setUser(session?.user ?? null);
        // Clear profile when session is null (user logged out)
        if (!session) {
          console.log("No session, clearing profile");
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    console.log("signOut called, current session:", !!session);
    // Only try to sign out if there's actually a session
    if (session?.user?.id) {
      // Clear MFA verification status in database
      try {
        await supabase
          .from("profiles")
          .update({ mfa_verified_at: null })
          .eq("id", session.user.id);
        console.log("Cleared mfa_verified_at for user");
      } catch (error) {
        console.error("Error clearing mfa_verified_at:", error);
      }

      console.log("Calling supabase.auth.signOut()");
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
      }
    } else {
      console.log("No session to sign out from, just clearing local state");
    }
    // Always clear local state regardless
    console.log("Clearing local state and cache");
    setSession(null);
    setUser(null);
    setProfile(null);
    clearProfileCache(); // Clear all cached profiles on logout
    prevSessionRef.current = null;
  }, [session, clearProfileCache]);

  // --- Add Function Implementation ---
  const signInWithPassword = useCallback(
    async (credentials: SignInWithPasswordCredentials) => {
      // No need to setLoading(true) here, as onAuthStateChange handles state updates
      const { error } = await supabase.auth.signInWithPassword(credentials);
      if (error) {
        console.error("Error signing in:", error);
      }
      // Return error status to the calling component
      return { error: error || null };
    },
    []
  );
  // --- End Add ---

  // Helper to determine if user is SuperAdmin (no school_id)
  const isSuperAdmin = useMemo(
    () => (profile ? profile.school_id === null : false),
    [profile]
  );

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      signOut,
      signInWithPassword, // <-- Add function to context value
      refetchProfile,
      clearProfileCache, // <-- Export cache clearing function
      isSuperAdmin,
    }),
    [session, user, profile, loading, signOut, signInWithPassword, refetchProfile, clearProfileCache, isSuperAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Export types for use in other components
export type { UserProfile };
