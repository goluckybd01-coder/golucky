/**
 * Admin TOTP (2FA) helpers — talks to the `admin-totp` edge function.
 * TOTP is mandatory for super_admin accounts and optional for others.
 */
import { supabase } from '@/lib/supabaseClient';

async function call(action: string, payload: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('admin-totp', {
    body: { action, ...payload },
  });
  if (error) throw new Error(error.message || 'TOTP request failed');
  if (data?.error) throw new Error(data.error);
  return data as any;
}

export interface TotpStatus {
  staffRole: string;
  totpEnabled: boolean;
  required: boolean;
}

export const totpStatus = () => call('status') as Promise<TotpStatus>;

export const totpEnroll = () =>
  call('enroll') as Promise<{ base32: string; otpauth: string }>;

export const totpConfirmEnroll = (code: string) => call('confirm-enroll', { code });

export const totpVerify = (code: string) => call('verify', { code });

export const totpDisable = (code: string) => call('disable', { code });
