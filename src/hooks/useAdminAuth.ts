import { useState, useEffect, useRef, useCallback } from 'react';
import {
  adminAuthStore,
  AdminAuthState,
  StaffAccount,
} from '@/lib/adminAuthStore';
import { StaffRole, Permission, ROLE_DEFAULT_PERMISSIONS } from '@/lib/adminPermissions';

interface UseAdminAuthReturn {
  isLoading: boolean;
  isAuthenticated: boolean;
  staffAccount: StaffAccount | null;
  permissions: Permission[];
  error: string | null;
  signOut: () => Promise<void>;
  refreshAuth: () => void;
}

/**
 * Hook for admin authentication
 * Uses centralized store - does NOT auto-initialize to prevent login page hangs
 * 
 * @param _redirectOnFail - Deprecated parameter kept for backward compatibility
 */
export const useAdminAuth = (_redirectOnFail?: boolean): UseAdminAuthReturn => {
  const isMountedRef = useRef(true);

  // Local state synced from store
  const [state, setState] = useState<AdminAuthState>(() => adminAuthStore.getState());

  useEffect(() => {
    isMountedRef.current = true;

    // Subscribe to store changes only - do NOT call init here
    // Login page handles its own session check
    const unsubscribe = adminAuthStore.subscribe((newState) => {
      if (isMountedRef.current) {
        setState(newState);
      }
    });

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, []);

  // Derive permissions from staff role
  const permissions: Permission[] = state.staffAccount
    ? ROLE_DEFAULT_PERMISSIONS[state.staffAccount.staff_role as StaffRole] || []
    : [];

  const signOut = useCallback(async () => {
    await adminAuthStore.signOut();
  }, []);

  const refreshAuth = useCallback(() => {
    // Force re-init
    adminAuthStore.reinit().catch(console.error);
  }, []);

  return {
    isLoading: state.isLoading,
    isAuthenticated: Boolean(state.session && state.staffAccount),
    staffAccount: state.staffAccount,
    permissions,
    error: state.error,
    signOut,
    refreshAuth,
  };
};
