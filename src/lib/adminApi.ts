// Admin API Client with Secure Memory-Only Auth
// SECURITY: JWT tokens are stored in memory only, not localStorage
import { 
  getAdminToken, 
  setAdminCredentials, 
  clearAdminCredentials 
} from './adminAuthStore';

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  // Allow spreading of response data
  [key: string]: unknown;
}

/**
 * Core API fetch function with secure auth handling
 * Uses memory-only token storage (not localStorage)
 */
async function apiFetch<T = unknown>(
  path: string,
  { method = 'GET', body, auth = true }: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<ApiResponse<T>> {
  const token = getAdminToken();

  // Check token if auth required - redirect to login if missing
  if (auth && !token) {
    console.warn('[Admin API] No token in memory - session may have expired');
    window.location.href = '/admin/login';
    return { success: false, error: 'Session expired - please login again' };
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Handle 401 - token invalid/expired - redirect to login
    if (res.status === 401) {
      console.warn('[Admin API] 401 Unauthorized - clearing credentials');
      clearAdminCredentials();
      window.location.href = '/admin/login';
      return { success: false, error: 'Session expired - please login again' };
    }

    const text = await res.text();
    let data: Record<string, unknown>;
    
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    if (!res.ok) {
      return {
        success: false,
        error: (data.error as string) || (data.message as string) || `Request failed with status ${res.status}`,
      };
    }

    return { success: true, data: data as T, ...data };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Network error';
    console.error('[Admin API] Request failed:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

// ============ ADMIN AUTH ============

export async function adminLogin(payload: { email: string; password: string }) {
  const result = await apiFetch('/api-auth/admin-login', {
    method: 'POST',
    body: payload,
    auth: false, // No auth required for login
  });

  // Response has token, role, user at root level (via spread)
  if (result.success && result.token) {
    // Note: setAdminCredentials is deprecated, use signIn from adminAuthStore instead
    console.log('[adminApi] Login successful via edge function');
  }

  return result;
}

export function adminLogout() {
  // SECURITY: Clear memory-only credentials
  clearAdminCredentials();
  
  // Redirect to login
  window.location.href = '/admin/login';
}

// ============ USERS ============

export async function fetchUsers(params: {
  role?: string;
  search?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const searchParams = new URLSearchParams();
  if (params.role) searchParams.set('role', params.role);
  if (params.search) searchParams.set('search', params.search);
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.offset) searchParams.set('offset', params.offset.toString());
  
  return apiFetch(`/api-admin/users?${searchParams.toString()}`);
}

export async function updateUserRole(userId: string, role: string) {
  return apiFetch(`/api-admin/users/${userId}/role`, {
    method: 'PATCH',
    body: { role },
  });
}

// ============ DEPOSITS ============

export async function fetchDeposits(params: {
  status?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set('status', params.status);
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.offset) searchParams.set('offset', params.offset.toString());
  
  return apiFetch(`/api-admin/deposits?${searchParams.toString()}`);
}

export async function approveDeposit(depositId: string, notes?: string) {
  return apiFetch(`/api-admin/deposits/${depositId}/approve`, {
    method: 'POST',
    body: { notes },
  });
}

export async function rejectDeposit(depositId: string, reason?: string) {
  return apiFetch(`/api-admin/deposits/${depositId}/reject`, {
    method: 'POST',
    body: { reason },
  });
}

// ============ WITHDRAWALS ============

export async function fetchWithdrawals(params: {
  status?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set('status', params.status);
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.offset) searchParams.set('offset', params.offset.toString());
  
  return apiFetch(`/api-admin/withdraws?${searchParams.toString()}`);
}

export async function approveWithdrawal(withdrawId: string, notes?: string) {
  return apiFetch(`/api-admin/withdraws/${withdrawId}/approve`, {
    method: 'POST',
    body: { notes },
  });
}

export async function rejectWithdrawal(withdrawId: string, notes?: string) {
  return apiFetch(`/api-admin/withdraws/${withdrawId}/reject`, {
    method: 'POST',
    body: { notes },
  });
}

// ============ STATS ============

export async function fetchDashboardStats() {
  return apiFetch('/api-admin/stats/dashboard');
}

export async function fetchTransactions(params: {
  user_id?: string;
  type?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const searchParams = new URLSearchParams();
  if (params.user_id) searchParams.set('user_id', params.user_id);
  if (params.type) searchParams.set('type', params.type);
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.offset) searchParams.set('offset', params.offset.toString());
  
  return apiFetch(`/api-admin/transactions?${searchParams.toString()}`);
}
