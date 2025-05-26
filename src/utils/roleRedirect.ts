import { UserProfile } from '@/contexts/AuthContext';

export const getDefaultRedirectPath = (profile: UserProfile | null): string => {
  if (!profile?.role || profile.role.length === 0) {
    return '/events'; // Default fallback
  }

  const roles = profile.role;

  // Admin can access everything, default to events
  if (roles.includes('admin')) {
    return '/events';
  }

  // Recruiter can scan cards and view events, default to scan page
  if (roles.includes('recruiter')) {
    return '/scan';
  }

  // Reviewer can only view events
  if (roles.includes('reviewer')) {
    return '/events';
  }

  // Fallback
  return '/events';
}; 