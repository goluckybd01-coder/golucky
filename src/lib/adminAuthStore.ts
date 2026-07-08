/**
 * Admin Authentication Store (Zustand-like pattern)
 */
import { supabase } from '@/lib/supabaseClient';

export interface AdminUser {
  id: string;
  email: string;
  user_id: string;
}

export interface StaffAccount {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  staff_role: string;
  staff_code: string | null;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface AdminAuthState {
  session: { user: AdminUser; accessToken: string } | null;
  staffAccount: StaffAccount | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

type AuthStateListener = (state: AdminAuthState) => void;

export const withTimeout = <T>(promise: Promise<T>, ms: number = 15000, label: string = 'Request'): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s.`)), ms);
    promise.then((r) => { window.clearTimeout(timeoutId); resolve(r); }).catch((e) => { window.clearTimeout(timeoutId); reject(e); });
  });
};

class AdminAuthStore {
  private state: AdminAuthState = { session: null, staffAccount: null, isLoading: false, isInitialized: false, error: null };
  private listeners: Set<AuthStateListener> = new Set();
  private initPromise: Promise<void> | null = null;
  private authSubscription: { unsubscribe: () => void } | null = null;
  getState(): AdminAuthState { return { ...this.state }; }
  subscribe(listener: AuthStateListener): () => void { this.listeners.add(listener); listener(this.getState()); return () => this.listeners.delete(listener); }
  private setState(partial: Partial<AdminAuthState>) { this.state = { ...this.state, ...partial }; this.listeners.forEach((l) => l(this.getState())); }
  async init(): Promise<void> { if (!this.initPromise) this.initPromise = this._doInit(); return this.initPromise; }
  private async _doInit(): Promise<void> {
    this.setState({ isLoading: true, error: null });
    const { data: sessionData, error: sessionError } = await withTimeout(supabase.auth.getSession(), 10000, 'Session check');
    if (sessionError) { this.setState({ isLoading: false, isInitialized: true, error: sessionError.message }); return; }
    if (sessionData?.session?.user) await this.verifyStaffAccount(sessionData.session.user.id, sessionData.session.access_token, sessionData.session.user.email);
    else this.setState({ session: null, staffAccount: null, isLoading: false, isInitialized: true });
    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'SIGNED_OUT') this.setState({ session: null, staffAccount: null, isLoading: false, error: null });
      else if (event === 'SIGNED_IN' && newSession?.user) setTimeout(() => this.verifyStaffAccount(newSession.user.id, newSession.access_token, newSession.user.email), 0);
    });
    this.authSubscription = authListener.subscription;
  }
  private async verifyStaffAccount(userId: string, accessToken: string, email?: string | null): Promise<void> {
    if (!accessToken?.trim()) { this.setState({ session: null, staffAccount: null, isLoading: false, isInitialized: true, error: null }); return; }
    try {
      const verifyResult = await Promise.race([
        supabase.functions.invoke('verify-admin-status', { headers: { Authorization: `Bearer ${accessToken}` } }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Admin verification timed out after 10s')), 10000)),
      ]);
      if (verifyResult.error) throw new Error(verifyResult.error.message);
      const payload = verifyResult.data as any;
      if (payload?.error || !payload?.isAdmin) { this.setState({ session: null, staffAccount: null, isLoading: false, isInitialized: true, error: payload?.message || 'Not authorized' }); return; }
      const staffAccount: StaffAccount = { id: payload.staffAccountId || userId, user_id: userId, email: email || payload.email || '', display_name: payload.displayName || 'Admin', staff_role: payload.staffRole || 'support', staff_code: payload.staffCode || null, is_active: true, created_at: new Date().toISOString(), last_login_at: null };
      this.setState({ session: { user: { id: staffAccount.id, email: email || '', user_id: userId }, accessToken }, staffAccount, isLoading: false, isInitialized: true, error: null });
    } catch (err: unknown) {
      this.setState({ session: null, staffAccount: null, isLoading: false, isInitialized: true, error: err instanceof Error ? err.message : 'Verification failed' });
    }
  }
  async signIn(email: string, password: string) {
    this.setState({ isLoading: true, error: null });
    const { data: authData, error: authError } = await withTimeout(supabase.auth.signInWithPassword({ email: email.trim(), password }), 15000, 'Login');
    if (authError || !authData.user || !authData.session) { this.setState({ isLoading: false, error: authError?.message || 'Login failed' }); return { success: false, error: authError?.message }; }
    await this.verifyStaffAccount(authData.user.id, authData.session.access_token, authData.user.email);
    if (this.getState().staffAccount) return { success: true };
    await supabase.auth.signOut();
    return { success: false, error: this.getState().error || 'Not authorized as admin' };
  }
  async signOut(): Promise<void> { await supabase.auth.signOut(); this.setState({ session: null, staffAccount: null, isLoading: false, error: null }); }
  destroy() { this.authSubscription?.unsubscribe(); this.listeners.clear(); }
}

export const adminAuthStore = new AdminAuthStore();
export const getAdminState = () => adminAuthStore.getState();
export const initAdminAuth = () => adminAuthStore.init();
export const signInAdmin = (email: string, password: string) => adminAuthStore.signIn(email, password);
export const signOutAdmin = () => adminAuthStore.signOut();
export const subscribeToAdminAuth = (listener: AuthStateListener) => adminAuthStore.subscribe(listener);
export const testSupabaseConnection = async () => { const s = Date.now(); const { error } = await withTimeout(supabase.auth.getSession(), 5000, 'Connection test'); return { success: !error, latencyMs: Date.now() - s, error: error?.message }; };
export const getAdminToken = () => adminAuthStore.getState().session?.accessToken || null;
export const getAdminRole = () => adminAuthStore.getState().staffAccount?.staff_role || null;
export const getAdminProfile = (): Record<string, unknown> | null => { const staff = adminAuthStore.getState().staffAccount; return staff ? ({ ...staff } as Record<string, unknown>) : null; };
export const isAdminAuthenticated = () => Boolean(adminAuthStore.getState().session);
export const setAdminCredentials = () => { console.warn('[AdminAuthStore] setAdminCredentials is deprecated'); };
export const clearAdminCredentials = () => adminAuthStore.signOut();
