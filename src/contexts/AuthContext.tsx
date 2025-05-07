// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
// Add SignInWithPasswordCredentials import
import { Session, User, SignInWithPasswordCredentials } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

interface AuthContextProps {
  session: Session | null;
  user: User | null;
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
  const [loading, setLoading] = useState(true);

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