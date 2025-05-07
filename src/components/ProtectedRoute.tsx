// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext'; // Import the useAuth hook

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth(); // Get user session and loading state

  if (loading) {
    // Optional: Show a loading spinner or skeleton screen while checking session
    return <div>Loading...</div>;
  }

  if (!user) {
    // If not loading and no user exists, redirect to login page
    // 'replace' prevents adding the protected route to browser history
    return <Navigate to="/login" replace />;
  }

  // If not loading and user exists, render the child route component
  return <Outlet />; // Outlet renders the component defined in the nested route (e.g., Dashboard)
};

export default ProtectedRoute;