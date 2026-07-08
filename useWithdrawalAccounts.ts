import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type WithdrawMethod = "ewallet" | "novafi" | "usdt" | "binance";

export interface LockedAccount {
  id: string;
  user_id: string;
  method: WithdrawMethod;
  provider: string | null;
  account_name: string | null;
  account_number: string | null;
  wallet_address: string | null;
  network: string | null;
  binance_pay_id: string | null;
  binance_email: string | null;
  is_locked: boolean;
  is_active: boolean;
  admin_approval_status: string;
  locked_at: string | null;
  created_at: string;
}

export interface ChangeRequest {
  id: string;
  account_id: string;
  method: WithdrawMethod;
  status: "pending" | "approved" | "rejected";
  reason: string;
  new_value: Record<string, unknown>;
  created_at: string;
  decided_at: string | null;
}

export const useWithdrawalAccounts = () => {
  const [accounts, setAccounts] = useState<LockedAccount[]>([]);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [kycVerified, setKycVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [accRes, reqRes, profRes] = await Promise.all([
      supabase.from("user_withdrawal_accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true),
      supabase.from("withdrawal_account_change_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("profiles")
        .select("kyc_verified")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    setAccounts((accRes.data as any) || []);
    setRequests((reqRes.data as any) || []);
    setKycVerified(Boolean((profRes.data as any)?.kyc_verified));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const getFor = useCallback((m: WithdrawMethod) =>
    accounts.find((a) => a.method === m) || null, [accounts]);

  const hasPending = useCallback((accountId: string) =>
    requests.some((r) => r.account_id === accountId && r.status === "pending"),
    [requests]);

  return { accounts, requests, kycVerified, loading, reload: load, getFor, hasPending };
};
