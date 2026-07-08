import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type WCTx = {
  id: string;
  type: string;
  amount: number;
  created_at: string;
  description: string | null;
};

export type WalletCentreData = {
  loading: boolean;
  authenticated: boolean;
  // wallet balances
  balance: number;
  bonus: number;
  commission: number;
  usdt: number;
  totalDeposit: number;
  totalWithdraw: number;
  // profile
  vipLevel: number;
  vipExp: number;
  kycVerified: boolean;
  // aggregates (last 7 days)
  weekDeposit: number;
  weekWithdraw: number;
  weekTurnover: number;
  weekNetProfit: number;
  gamesPlayed: number;
  winRate: number; // 0-100
  // agent
  agentTodayCommission: number;
  agentMonthCommission: number;
  agentPendingCommission: number;
  agentTotalCommission: number;
  activeReferrals: number;
  // fixed deposits
  fdActiveCount: number;
  fdTotalLocked: number;
  fdExpectedReturn: number;
  fdRunningProfit: number;
  fdNextMaturity: string | null;
  // cashback
  cashbackLast30: number;
  cashbackPending: number;
  // transfers
  transferCount: number;
  // transactions
  recent: WCTx[];
  // income distribution (30d)
  income: { label: string; v: number }[];
  // security
  securityAlertsOpen: number;
  // refresh
  refresh: () => Promise<void>;
};

const EMPTY: Omit<WalletCentreData, "refresh"> = {
  loading: true,
  authenticated: false,
  balance: 0, bonus: 0, commission: 0, usdt: 0,
  totalDeposit: 0, totalWithdraw: 0,
  vipLevel: 0, vipExp: 0, kycVerified: false,
  weekDeposit: 0, weekWithdraw: 0, weekTurnover: 0, weekNetProfit: 0,
  gamesPlayed: 0, winRate: 0,
  agentTodayCommission: 0, agentMonthCommission: 0,
  agentPendingCommission: 0, agentTotalCommission: 0, activeReferrals: 0,
  fdActiveCount: 0, fdTotalLocked: 0, fdExpectedReturn: 0,
  fdRunningProfit: 0, fdNextMaturity: null,
  cashbackLast30: 0, cashbackPending: 0,
  transferCount: 0,
  recent: [],
  income: [],
  securityAlertsOpen: 0,
};

const sum = (rows: any[] | null, col: string) =>
  (rows ?? []).reduce((s, r) => s + Number(r?.[col] ?? 0), 0);

export function useWalletCentreData(): WalletCentreData {
  const [state, setState] = useState<Omit<WalletCentreData, "refresh">>(EMPTY);

  const load = async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id ?? null;
      if (!uid) {
        setState({ ...EMPTY, loading: false, authenticated: false });
        return;
      }
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 86400_000).toISOString();
      const monthAgo = new Date(now.getTime() - 30 * 86400_000).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      const [
        walletRes, profileRes, weekTxRes, monthTxRes, recentRes,
        agentTodayRes, agentMonthRes, agentPendingRes, agentTotalRes, referralRes,
        fdActiveRes, fdMaturityRes, cashbackRes, transferRes, alertRes,
      ] = await Promise.all([
        supabase.from("wallets").select("balance,bonus_balance,commission_balance,balance_usdt,total_deposit,total_withdraw").eq("user_id", uid).maybeSingle(),
        supabase.from("profiles").select("vip_level,vip_exp,kyc_verified").eq("user_id", uid).maybeSingle(),
        supabase.from("wallet_transactions").select("type,amount").eq("user_id", uid).gte("created_at", weekAgo),
        supabase.from("wallet_transactions").select("type,amount").eq("user_id", uid).gte("created_at", monthAgo),
        supabase.from("wallet_transactions").select("id,type,amount,created_at,description").eq("user_id", uid).order("created_at", { ascending: false }).limit(30),
        supabase.from("agent_commissions").select("commission_amount").eq("agent_user_id", uid).gte("created_at", todayStart),
        supabase.from("agent_commissions").select("commission_amount").eq("agent_user_id", uid).gte("created_at", monthStart),
        supabase.from("agent_commissions").select("commission_amount").eq("agent_user_id", uid).eq("is_credited", false),
        supabase.from("agent_commissions").select("commission_amount").eq("agent_user_id", uid),
        supabase.from("profiles").select("user_id", { count: "exact", head: true }).eq("referred_by", uid),
        supabase.from("fixed_deposits").select("amount,expected_profit,total_return,start_date,end_date,duration_days").eq("user_id", uid).eq("status", "active"),
        supabase.from("fixed_deposits").select("end_date").eq("user_id", uid).eq("status", "active").order("end_date", { ascending: true }).limit(1).maybeSingle(),
        supabase.from("cashback_records").select("final_cashback,status,created_at").eq("user_id", uid).gte("created_at", monthAgo),
        supabase.from("wallet_transfers").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("security_alerts").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("is_resolved", false),
      ]);

      const w = walletRes.data as any;
      const p = profileRes.data as any;

      // week aggregates
      const weekTx = (weekTxRes.data ?? []) as any[];
      const weekDeposit = weekTx.filter((t) => t.type === "deposit").reduce((s, r) => s + Number(r.amount), 0);
      const weekWithdraw = weekTx.filter((t) => t.type === "withdraw").reduce((s, r) => s + Number(r.amount), 0);
      const bets = weekTx.filter((t) => t.type === "bet");
      const wins = weekTx.filter((t) => t.type === "win");
      const weekTurnover = bets.reduce((s, r) => s + Number(r.amount), 0);
      const weekWin = wins.reduce((s, r) => s + Number(r.amount), 0);
      const weekNetProfit = weekWin - weekTurnover;
      const gamesPlayed = bets.length;
      const winRate = gamesPlayed ? Math.round((wins.length / gamesPlayed) * 100) : 0;

      // income distribution (30d)
      const monthTx = (monthTxRes.data ?? []) as any[];
      const bucket = (fn: (t: any) => boolean, label: string) => ({
        label,
        v: monthTx.filter(fn).reduce((s, r) => s + Number(r.amount), 0),
      });
      const income = [
        bucket((t) => t.type === "win", "Game Wins"),
        bucket((t) => t.type === "bonus", "Cashback / Bonus"),
        bucket((t) => t.type === "referral", "Referral"),
        bucket((t) => t.type === "commission", "Agent Commission"),
        bucket((t) => t.type === "fd_profit" || t.type === "fd_return", "FD Interest"),
        bucket((t) => t.type === "vip_reward", "VIP Bonus"),
      ].filter((r) => r.v > 0);

      // fixed deposits
      const fds = (fdActiveRes.data ?? []) as any[];
      const fdTotalLocked = sum(fds, "amount");
      const fdExpectedReturn = sum(fds, "total_return");
      const fdRunningProfit = fds.reduce((s, fd) => {
        const start = new Date(fd.start_date).getTime();
        const end = new Date(fd.end_date).getTime();
        const now2 = Date.now();
        if (end <= start) return s;
        const pct = Math.max(0, Math.min(1, (now2 - start) / (end - start)));
        return s + Number(fd.expected_profit) * pct;
      }, 0);

      // cashback
      const cashRows = (cashbackRes.data ?? []) as any[];
      const cashbackLast30 = sum(cashRows, "final_cashback");
      const cashbackPending = cashRows.filter((r) => r.status === "pending").reduce((s, r) => s + Number(r.final_cashback), 0);

      setState({
        loading: false,
        authenticated: true,
        balance: Number(w?.balance ?? 0),
        bonus: Number(w?.bonus_balance ?? 0),
        commission: Number(w?.commission_balance ?? 0),
        usdt: Number(w?.balance_usdt ?? 0),
        totalDeposit: Number(w?.total_deposit ?? 0),
        totalWithdraw: Number(w?.total_withdraw ?? 0),
        vipLevel: Number(p?.vip_level ?? 0),
        vipExp: Number(p?.vip_exp ?? 0),
        kycVerified: Boolean(p?.kyc_verified),
        weekDeposit, weekWithdraw, weekTurnover, weekNetProfit,
        gamesPlayed, winRate,
        agentTodayCommission: sum(agentTodayRes.data as any[], "commission_amount"),
        agentMonthCommission: sum(agentMonthRes.data as any[], "commission_amount"),
        agentPendingCommission: sum(agentPendingRes.data as any[], "commission_amount"),
        agentTotalCommission: sum(agentTotalRes.data as any[], "commission_amount"),
        activeReferrals: referralRes.count ?? 0,
        fdActiveCount: fds.length,
        fdTotalLocked, fdExpectedReturn, fdRunningProfit,
        fdNextMaturity: (fdMaturityRes.data as any)?.end_date ?? null,
        cashbackLast30, cashbackPending,
        transferCount: transferRes.count ?? 0,
        recent: (recentRes.data ?? []) as WCTx[],
        income,
        securityAlertsOpen: alertRes.count ?? 0,
      });
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ...state, refresh: load };
}
