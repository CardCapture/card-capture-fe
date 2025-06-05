// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
// Add SignInWithPasswordCredentials import
import {
  Session,
  User,
  SignInWithPasswordCredentials,
} from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

// Enhanced types for permissions
interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: ("admin" | "recruiter" | "reviewer")[];
  school_id: string | null; // Allow null for SuperAdmins
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

  // Fetch user profile when session changes
  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user?.id) {
        setProfile(null);
        return;
      }

      console.log("DEBUG: Fetching profile for user:", session.user.id);
      console.log("DEBUG: User metadata:", session.user.user_metadata);
      console.log("DEBUG: App metadata:", session.user.app_metadata);

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, email, first_name, last_name, role, school_id")
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
      } catch (error) {
        console.error("Error in fetchProfile:", error);
        setProfile(null);
      }
    };

    fetchProfile();
  }, [session]);

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
    if (session) {
      console.log("Calling supabase.auth.signOut()");
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
      }
    } else {
      console.log("No session to sign out from, just clearing local state");
    }
    // Always clear local state regardless
    console.log("Clearing local state");
    setSession(null);
    setUser(null);
    setProfile(null);
  }, [session]);

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
      isSuperAdmin,
    }),
    [session, user, profile, loading, signOut, signInWithPassword, isSuperAdmin]
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
