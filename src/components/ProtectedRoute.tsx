// src/components/ProtectedRoute.tsx
import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext"; // Import the useAuth hook
import { supabase } from "@/lib/supabaseClient";

const ProtectedRoute: React.FC = () => {
  const { user, profile, loading, isSuperAdmin } = useAuth(); // Get user session, profile, and loading state
  const location = useLocation(); // Get current location to preserve redirect path
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

  // TEMPORARILY DISABLED - MFA verification check bypassed
  useEffect(() => {
    // MFA is disabled - skip all checks
    setRequiresMfa(false);
    setMfaCheckLoading(false);

    // const checkMfaStatus = async () => {
    //   if (!user?.id || !profile) {
    //     setMfaCheckLoading(false);
    //     return;
    //   }

    //   try {
    //     // Check if user has MFA enabled
    //     const { data: mfaSettings, error } = await supabase
    //       .from("user_mfa_settings")
    //       .select("mfa_enabled")
    //       .eq("user_id", user.id)
    //       .maybeSingle();

    //     if (error) {
    //       console.error("Error checking MFA settings:", error);
    //       setRequiresMfa(false);
    //       setMfaCheckLoading(false);
    //       return;
    //     }

    //     // If user has MFA enabled but hasn't verified this session, require MFA
    //     // Note: If phone_number is missing, the login flow will detect this and
    //     // redirect user through enrollment instead of challenge
    //     if (mfaSettings?.mfa_enabled && !profile.mfa_verified_at) {
    //       console.log("ProtectedRoute: MFA required but not verified");
    //       setRequiresMfa(true);
    //     } else {
    //       setRequiresMfa(false);
    //     }
    //   } catch (error) {
    //     console.error("Error in checkMfaStatus:", error);
    //     setRequiresMfa(false);
    //   } finally {
    //     setMfaCheckLoading(false);
    //   }
    // };

    // if (!loading && user && profile) {
    //   checkMfaStatus();
    // } else if (!loading && !user) {
    //   setMfaCheckLoading(false);
    // }
  }, [user, profile, loading]);

  if (loading || mfaCheckLoading) {
    // Optional: Show a loading spinner or skeleton screen while checking session
    return <div>Loading...</div>;
  }

  if (!user) {
    // If not loading and no user exists, redirect to login page
    // 'replace' prevents adding the protected route to browser history
    // Pass the current location so we can redirect back after login
    console.log("ProtectedRoute: Redirecting to login (no user), saving path:", location.pathname);
    console.log("ProtectedRoute: Full location:", location);
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If user needs MFA verification, redirect to login (but don't sign them out)
  // The login page will handle the MFA flow
  if (requiresMfa) {
    console.log("ProtectedRoute: MFA required but not verified - redirecting to login for MFA flow");
    // Don't sign out - let the login page handle the MFA flow
    // Signing out here causes issues when users are mid-MFA enrollment
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
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
