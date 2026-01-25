import { UserProfile } from '@/contexts/AuthContext';

export const getDefaultRedirectPath = (profile: UserProfile | null): string => {
  if (!profile?.role || profile.role.length === 0) {
    return '/events'; // Default fallback
  }

  const roles = profile.role;

  // Recruiter should default to scan page (even if they also have admin role)
  if (roles.includes('recruiter')) {
    return '/scan';
  }

  // Admin without recruiter role defaults to events
  if (roles.includes('admin')) {
    return '/events';
  }

  // Reviewer can only view events
  if (roles.includes('reviewer')) {
    return '/events';
  }

  // Fallback
  return '/events';
}; 