// src/components/ProtectedRoute.tsx
import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext"; // Import the useAuth hook
import { supabase } from "@/lib/supabaseClient";

const ProtectedRoute: React.FC = () => {
  const { user, profile, loading, isSuperAdmin } = useAuth(); // Get user session, profile, and loading state
  const [mfaCheckLoading, setMfaCheckLoading] = useState(true);
  const [requiresMfa, setRequiresMfa] = useState(false);

  console.log("ProtectedRoute render:", {
    user: !!user,
    profile: !!profile,
    loading,
    mfaCheckLoading,
    requiresMfa,
    isSuperAdmin,
    currentPath: window.location.pathname,
    mfaVerifiedAt: profile?.mfa_verified_at,
  });

  // Check if user needs MFA verification
  useEffect(() => {
    const checkMfaStatus = async () => {
      if (!user?.id || !profile) {
        setMfaCheckLoading(false);
        return;
      }

      try {
        // Check if user has MFA enabled
        const { data: mfaSettings, error } = await supabase
          .from("user_mfa_settings")
          .select("mfa_enabled")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error checking MFA settings:", error);
          setRequiresMfa(false);
          setMfaCheckLoading(false);
          return;
        }

        // If user has MFA enabled but hasn't verified this session, require MFA
        if (mfaSettings?.mfa_enabled && !profile.mfa_verified_at) {
          console.log("ProtectedRoute: MFA required but not verified");
          setRequiresMfa(true);
        } else {
          setRequiresMfa(false);
        }
      } catch (error) {
        console.error("Error in checkMfaStatus:", error);
        setRequiresMfa(false);
      } finally {
        setMfaCheckLoading(false);
      }
    };

    if (!loading && user && profile) {
      checkMfaStatus();
    } else if (!loading && !user) {
      setMfaCheckLoading(false);
    }
  }, [user, profile, loading]);

  if (loading || mfaCheckLoading) {
    // Optional: Show a loading spinner or skeleton screen while checking session
    return <div>Loading...</div>;
  }

  if (!user) {
    // If not loading and no user exists, redirect to login page
    // 'replace' prevents adding the protected route to browser history
    console.log("ProtectedRoute: Redirecting to login (no user)");
    return <Navigate to="/login" replace />;
  }

  // If user needs MFA verification, sign them out to start fresh
  if (requiresMfa) {
    console.log("ProtectedRoute: MFA required but not verified - signing out to force fresh login");
    // Sign out the user to avoid infinite redirect loop
    // This ensures they go through the full MFA flow
    supabase.auth.signOut().then(() => {
      console.log("ProtectedRoute: Signed out user, redirecting to login");
    });
    return <Navigate to="/login" replace />;
  }

  // If user is SuperAdmin, redirect to SuperAdmin dashboard
  if (isSuperAdmin) {
    console.log("ProtectedRoute: Redirecting SuperAdmin to /superadmin");
    return <Navigate to="/superadmin" replace />;
  }

  // If not loading and user exists and is not SuperAdmin, render the child route component
  console.log("ProtectedRoute: Rendering outlet for regular user");
  return <Outlet />; // Outlet renders the component defined in the nested route (e.g., Dashboard)
};

export default ProtectedRoute;
