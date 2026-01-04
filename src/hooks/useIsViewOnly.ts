import { useAuth } from './useAuth';

/**
 * Hook to check if the current user is in view-only mode
 * View-only users can view and print/export but cannot make changes
 */
export function useIsViewOnly(): boolean {
  const { user } = useAuth();
  
  // Check if user has 'viewer' or 'view-only' role
  if (!user) return false;
  
  const viewOnlyRoles = ['viewer', 'view-only', 'readonly'];
  return viewOnlyRoles.includes(user.role?.toLowerCase() || '');
}

