import React from 'react';
import { Navigate } from 'react-router-dom';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/contexts/AuthContext';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: keyof ReturnType<typeof useRole>;
  fallbackPath?: string;
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ 
  children, 
  requiredPermission,
  fallbackPath = '/events' 
}) => {
  const permissions = useRole();
  const { profile, loading } = useAuth();

  // If no specific permission is required, allow access
  if (!requiredPermission) {
    return <>{children}</>;
  }

  // Wait for profile to load before checking permissions
  if (loading || !profile) {
    return <div>Loading...</div>;
  }

  // Check if user has the required permission
  const hasPermission = permissions[requiredPermission];

  if (!hasPermission) {
    // Redirect to fallback path if user doesn't have permission
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default RoleProtectedRoute; 