// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
// Add SignInWithPasswordCredentials import
import { Session, User, SignInWithPasswordCredentials } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

// Enhanced types for permissions
interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: ('admin' | 'recruiter' | 'reviewer')[];
  school_id: string;
}

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  // --- Add Function Signature ---
  signInWithPassword: (credentials: SignInWithPasswordCredentials) => Promise<{ error: Error | null }>;
  // --- End Add ---
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name, role, school_id')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          setProfile(null);
          return;
        }

        setProfile(data);
      } catch (error) {
        console.error('Error in fetchProfile:', error);
        setProfile(null);
      }
    };

    fetchProfile();
  }, [session]);

  useEffect(() => {
    setLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
        console.error("Error getting initial session:", error);
        setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log("Auth state changed:", _event, session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
     const { error } = await supabase.auth.signOut();
     if (error) { console.error("Error signing out:", error); }
     setProfile(null);
  };

  // --- Add Function Implementation ---
  const signInWithPassword = async (credentials: SignInWithPasswordCredentials) => {
      // No need to setLoading(true) here, as onAuthStateChange handles state updates
      const { error } = await supabase.auth.signInWithPassword(credentials);
      if (error) {
          console.error("Error signing in:", error);
      }
      // Return error status to the calling component
      return { error: error || null };
  };
  // --- End Add ---

  const value = {
    session,
    user,
    profile,
    loading,
    signOut,
    signInWithPassword, // <-- Add function to context value
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export types for use in other components
export type { UserProfile };