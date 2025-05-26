import { useAuth } from '@/contexts/AuthContext';

export const useRole = () => {
  const { profile } = useAuth();
  const roles = profile?.role || [];

  return {
    // Basic role checks
    isAdmin: roles.includes('admin'),
    isRecruiter: roles.includes('recruiter'),
    isReviewer: roles.includes('reviewer'),
    
    // Combined checks
    hasRole: (role: string) => roles.includes(role as any),
    hasAnyRole: (checkRoles: string[]) => checkRoles.some(role => roles.includes(role as any)),
    hasAllRoles: (checkRoles: string[]) => checkRoles.every(role => roles.includes(role as any)),
    
    // Feature permissions
    canManageUsers: roles.includes('admin'),
    canInviteUsers: roles.some(r => ['admin', 'recruiter'].includes(r)),
    canDeleteUsers: roles.includes('admin'),
    canEditUsers: roles.includes('admin'),
    canViewAllUsers: roles.includes('admin'),
    
    canScanCards: roles.some(r => ['admin', 'recruiter'].includes(r)),
    canReviewCards: roles.some(r => ['admin', 'recruiter', 'reviewer'].includes(r)),
    canBulkActionCards: roles.some(r => ['admin', 'recruiter'].includes(r)),
    canExportCards: roles.some(r => ['admin', 'recruiter'].includes(r)),
    
    canCreateEvents: roles.some(r => ['admin', 'recruiter'].includes(r)),
    canDeleteEvents: roles.includes('admin'),
    canArchiveEvents: roles.some(r => ['admin', 'recruiter'].includes(r)),
    
    canAccessAdminSettings: roles.includes('admin'),
    canAccessBilling: roles.includes('admin'),
    canAccessIntegrations: roles.includes('admin'),
    
    // Navigation permissions
    canAccessScanPage: roles.some(r => ['admin', 'recruiter'].includes(r)),
    canAccessEventsPage: roles.some(r => ['admin', 'reviewer'].includes(r)),
    canAccessDashboard: roles.length > 0, // Any role can access dashboard
    canAccessSettings: roles.includes('admin'),
    
    // Raw data
    roles,
    profile,
  };
}; 