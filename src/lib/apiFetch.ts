/**
 * API Fetch Wrapper
 * 
 * Automatically attaches Authorization Bearer token to all requests.
 * Uses Supabase session for authentication.
 */

import { supabase } from "@/integrations/supabase/client";

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export interface ApiFetchOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

export interface ApiFetchResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

/**
 * Get the current user's access token
 */
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

async function refreshAuthToken(): Promise<string | null> {
  const { data: { session }, error } = await supabase.auth.refreshSession();
  if (error) {
    console.warn("[apiFetch] Session refresh failed:", error.message);
    return null;
  }
  return session?.access_token || null;
}

/**
 * Authenticated API fetch wrapper
 * 
 * @param path - API path (e.g., "/api-wallet/balance" or "api-game/bet")
 * @param options - Fetch options including method, body, headers
 * @returns Promise with typed response
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<ApiFetchResponse<T>> {
  const { method = "GET", body, headers = {}, skipAuth = false } = options;

  // Build headers
  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  // Add auth token if not skipped
  if (!skipAuth) {
    const token = await getAuthToken();
    if (!token) {
      // No session: return a soft failure so global error reporters don't
      // flag this as a runtime 401 on public/logged-out routes.
      return { success: false, error: "Not authenticated", status: 200 };
    }
    requestHeaders["Authorization"] = `Bearer ${token}`;
  }

  // Normalize path
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE}${normalizedPath}`;

  try {
    let response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!skipAuth && response.status === 401) {
      const refreshedToken = await refreshAuthToken();
      if (refreshedToken) {
        requestHeaders["Authorization"] = `Bearer ${refreshedToken}`;
        response = await fetch(url, {
          method,
          headers: requestHeaders,
          body: body ? JSON.stringify(body) : undefined,
        });
      }
    }

    const text = await response.text();
    let data: unknown;

    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = data as { error?: string; message?: string };
      return {
        success: false,
        error: errorData.error || errorData.message || `Request failed with status ${response.status}`,
        status: response.status,
      };
    }

    // Return successful response
    const responseData = data as { success?: boolean; data?: T; error?: string };
    return {
      success: responseData.success !== false,
      data: responseData.data ?? (data as T),
      status: response.status,
    };
  } catch (error) {
    console.error("[apiFetch] Network error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

// ========== Convenience methods ==========

/**
 * GET request
 */
export function apiGet<T = unknown>(path: string, options?: Omit<ApiFetchOptions, "method" | "body">) {
  return apiFetch<T>(path, { ...options, method: "GET" });
}

/**
 * POST request
 */
export function apiPost<T = unknown>(path: string, body?: Record<string, unknown>, options?: Omit<ApiFetchOptions, "method">) {
  return apiFetch<T>(path, { ...options, method: "POST", body });
}

/**
 * PUT request
 */
export function apiPut<T = unknown>(path: string, body?: Record<string, unknown>, options?: Omit<ApiFetchOptions, "method">) {
  return apiFetch<T>(path, { ...options, method: "PUT", body });
}

/**
 * DELETE request
 */
export function apiDelete<T = unknown>(path: string, options?: Omit<ApiFetchOptions, "method" | "body">) {
  return apiFetch<T>(path, { ...options, method: "DELETE" });
}

// ========== Game-specific API calls ==========

export interface PlaceBetParams {
  game: string;
  amount: number;
  roundId: string;
  betType?: string;
  betValue?: string;
  multiplier?: number;
  potentialWin?: number;
}

export interface PlaceBetResponse {
  betId: string;
  newBalance: number;
  amount: number;
  roundId: string;
  game: string;
}

/**
 * Place a bet via api-game/bet
 */
export function placeBetApi(params: PlaceBetParams) {
  return apiPost<PlaceBetResponse>("/api-game/bet", params as unknown as Record<string, unknown>);
}

export interface SettleBetParams {
  roundId: string;
  result: string | number;
  winAmount: number;
  gameType?: string;
}

export interface SettleBetResponse {
  roundId: string;
  result: string | number;
  winAmount: number;
  newBalance: number;
  status: string;
}

/**
 * Settle a round via api-game/settle
 */
export function settleBetApi(params: SettleBetParams) {
  return apiPost<SettleBetResponse>("/api-game/settle", params as unknown as Record<string, unknown>);
}

export interface WalletBalanceResponse {
  balance: number;
  total_deposit: number;
  total_withdraw: number;
  total_bet: number;
  total_win: number;
  currency: string;
  currency_symbol: string;
  formatted_balance: string;
}

/**
 * Get wallet balance via api-wallet/balance
 */
export function getWalletBalanceApi() {
  return apiGet<WalletBalanceResponse>("/api-wallet/balance");
}
