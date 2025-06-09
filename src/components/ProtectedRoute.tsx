// src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext"; // Import the useAuth hook

const ProtectedRoute: React.FC = () => {
  const { user, loading, isSuperAdmin } = useAuth(); // Get user session and loading state

  console.log("ProtectedRoute render:", {
    user: !!user,
    loading,
    isSuperAdmin,
    currentPath: window.location.pathname,
  });

  if (loading) {
    // Optional: Show a loading spinner or skeleton screen while checking session
    return <div>Loading...</div>;
  }

  if (!user) {
    // If not loading and no user exists, redirect to login page
    // 'replace' prevents adding the protected route to browser history
    console.log("ProtectedRoute: Redirecting to login (no user)");
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
