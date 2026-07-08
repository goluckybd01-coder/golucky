/**
 * Dual Wallet Service — thin wrappers over the atomic RPCs.
 * Backend is single source of truth: never mutate balance locally.
 */
import { supabase } from "@/integrations/supabase/client";

export type ConvertDirection = "bdt_to_usdt" | "usdt_to_bdt";

export interface WalletActionResult {
  success: boolean;
  error?: string;
  duplicate?: boolean;
  balance_bdt?: number;
  balance_usdt?: number;
  balance_main?: number;
  balance_provider?: number;
  rate_used?: number;
  reference_id?: string;
}

function genRef(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function convertCurrency(
  direction: ConvertDirection,
  amount: number,
  reference?: string,
): Promise<WalletActionResult> {
  const { data, error } = await supabase.rpc("wallet_convert_currency" as any, {
    p_direction: direction,
    p_amount: amount,
    p_reference_id: reference ?? genRef("cnv"),
  });
  if (error) return { success: false, error: error.message };
  return (data ?? { success: false, error: "empty response" }) as WalletActionResult;
}

export async function transferToProvider(
  amount: number,
  providerCode: string,
  reference?: string,
): Promise<WalletActionResult> {
  const { data, error } = await supabase.rpc("wallet_transfer_to_provider" as any, {
    p_amount: amount,
    p_provider_code: providerCode,
    p_reference_id: reference ?? genRef("m2p"),
  });
  if (error) return { success: false, error: error.message };
  return (data ?? { success: false, error: "empty response" }) as WalletActionResult;
}

export async function transferFromProvider(
  amount: number,
  providerCode: string,
  reference?: string,
): Promise<WalletActionResult> {
  const { data, error } = await supabase.rpc("wallet_transfer_from_provider" as any, {
    p_amount: amount,
    p_provider_code: providerCode,
    p_reference_id: reference ?? genRef("p2m"),
  });
  if (error) return { success: false, error: error.message };
  return (data ?? { success: false, error: "empty response" }) as WalletActionResult;
}

export async function adminSetUsdtRate(rate: number): Promise<WalletActionResult> {
  const { data, error } = await supabase.rpc("admin_set_usdt_rate" as any, {
    p_new_rate: rate,
  });
  if (error) return { success: false, error: error.message };
  return (data ?? { success: false, error: "empty response" }) as WalletActionResult;
}

export function formatBDT(n: number) {
  return `৳${(n ?? 0).toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;
}
export function formatUSDT(n: number) {
  return `$${(n ?? 0).toLocaleString("en-US", { maximumFractionDigits: 4 })}`;
}
