import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu, Bell, Plus, Crown, Check, Lock, Gift, Diamond, Shield, Percent,
  ChevronRight, User as UserIcon, Loader2, Sparkles, TrendingUp, Trophy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useWalletDB } from "@/hooks/useWalletDB";
import Seo from "@/components/seo/Seo";
import goluckyTextLogo from "@/assets/golucky-text-logo-1.png";

/* ---------- Data model ---------- */
interface VIPLevel {
  level: number;
  minExp: number;
  levelUpReward: number;
  monthlyReward: number;
  safePercent: number;
  rebateRate: number;
}
interface ClaimedReward {
  reward_type: "level_up" | "monthly";
  vip_level: number;
  claim_month: string | null;
}

const vipLevels: VIPLevel[] = [
  { level: 1,  minExp: 0,          levelUpReward: 30,    monthlyReward: 0,      safePercent: 0.10, rebateRate: 0.60 },
  { level: 2,  minExp: 1_000,      levelUpReward: 60,    monthlyReward: 0,      safePercent: 0.10, rebateRate: 0.60 },
  { level: 3,  minExp: 5_000,      levelUpReward: 120,   monthlyReward: 360,    safePercent: 0.15, rebateRate: 0.60 },
  { level: 4,  minExp: 25_000,     levelUpReward: 580,   monthlyReward: 900,    safePercent: 0.20, rebateRate: 0.65 },
  { level: 5,  minExp: 100_000,    levelUpReward: 1_200, monthlyReward: 2_000,  safePercent: 0.25, rebateRate: 0.65 },
  { level: 6,  minExp: 500_000,    levelUpReward: 2_000, monthlyReward: 6_000,  safePercent: 0.25, rebateRate: 0.70 },
  { level: 7,  minExp: 2_000_000,  levelUpReward: 3_500, monthlyReward: 10_500, safePercent: 0.30, rebateRate: 0.70 },
  { level: 8,  minExp: 10_000_000, levelUpReward: 12_000, monthlyReward: 36_000, safePercent: 0.35, rebateRate: 0.75 },
  { level: 9,  minExp: 50_000_000, levelUpReward: 18_000, monthlyReward: 54_000, safePercent: 0.35, rebateRate: 0.80 },
  { level: 10, minExp: 100_000_000, levelUpReward: 58_000, monthlyReward: 174_000, safePercent: 0.40, rebateRate: 0.80 },
];

/* ---------- Design tokens (match reference) ---------- */
const GOLD = "#F4B419";
const GOLD_SOFT = "#FFD54A";
const GREEN = "#22C55E";
const CARD_BG = "linear-gradient(180deg,#0A0D14 0%,#05070C 100%)";
const CARD_BORDER = "1px solid rgba(244,180,25,0.35)";
const CARD_SHADOW = "inset 0 0 0 1px rgba(244,180,25,0.08), 0 0 24px rgba(244,180,25,0.06)";

const bdt = (n: number) => `৳${n.toLocaleString("en-IN")}`;
const fmtExp = (n: number) => n.toLocaleString("en-IN");

/* ---------- VIP Shield icon (SVG) ---------- */
function VIPShield({
  size = 44, level, state, showCrown = false,
}: {
  size?: number;
  level: number;
  state: "achieved" | "current" | "locked";
  showCrown?: boolean;
}) {
  const fillGold = state !== "locked";
  const grad = fillGold
    ? `linear-gradient(180deg,#FFE082 0%,#F4B419 45%,#8A5A00 100%)`
    : `linear-gradient(180deg,#2A2F3A 0%,#12151C 100%)`;
  const border = fillGold ? "rgba(255,213,74,0.9)" : "rgba(255,255,255,0.18)";
  const glow = state === "current" ? `0 0 22px ${GOLD}, 0 0 42px rgba(244,180,25,0.45)` : "none";
  return (
    <div className="relative flex flex-col items-center" style={{ width: size + 8 }}>
      {showCrown && (
        <Crown className="absolute -top-2 h-4 w-4" style={{ color: GOLD_SOFT }} fill={GOLD} />
      )}
      <div
        className="relative grid place-items-center"
        style={{
          width: size, height: size * 1.15,
          background: grad,
          clipPath: "polygon(50% 0,100% 18%,100% 66%,50% 100%,0 66%,0 18%)",
          boxShadow: glow,
          border: `1px solid ${border}`,
        }}
      >
        <span
          className="font-black leading-none"
          style={{
            fontSize: size * 0.34,
            color: fillGold ? "#1a1000" : "rgba(255,255,255,0.55)",
            textShadow: fillGold ? "0 1px 0 rgba(255,255,255,0.4)" : "none",
          }}
        >
          {state === "current" ? `VIP\n${level}`.split("\n").map((t, i) => <div key={i}>{t}</div>) : level}
        </span>
        {state === "achieved" && (
          <div
            className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full"
            style={{ background: GREEN, border: "1.5px solid #04060A" }}
          >
            <Check className="h-2.5 w-2.5 text-black" strokeWidth={4} />
          </div>
        )}
        {state === "locked" && (
          <Lock className="absolute h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.45)" }} />
        )}
      </div>
      <span
        className="mt-1 text-[10px] font-black tracking-wider"
        style={{ color: fillGold ? GOLD_SOFT : "rgba(255,255,255,0.45)" }}
      >
        VIP {level}
      </span>
    </div>
  );
}

/* ---------- Section title ---------- */
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-3 flex items-center justify-center gap-3">
    <span className="text-[10px]" style={{ color: GOLD }}>◆</span>
    <h3 className="text-[13px] font-black uppercase tracking-[0.18em]" style={{ color: GOLD_SOFT }}>{children}</h3>
    <span className="text-[10px]" style={{ color: GOLD }}>◆</span>
  </div>
);

/* ================================================================ */
const VIP = () => {
  const navigate = useNavigate();
  const { balance } = useWalletDB();
  const [currentLevel, setCurrentLevel] = useState(1);
  const [totalExp, setTotalExp] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [claimedRewards, setClaimedRewards] = useState<ClaimedReward[]>([]);
  const [claimingLevelUp, setClaimingLevelUp] = useState(false);
  const [claimingMonthly, setClaimingMonthly] = useState(false);
  const [history, setHistory] = useState<Array<{ label: string; amount: string; date: string; type: string }>>([]);
  const cmpRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchUserData(); }, []);

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  };

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const [w, c] = await Promise.all([
        supabase.from("wallets").select("total_bet").eq("user_id", user.id).maybeSingle(),
        supabase.from("vip_reward_claims").select("reward_type, vip_level, claim_month, amount, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      ]);
      if (w.data) {
        const exp = (w.data as any).total_bet || 0;
        setTotalExp(exp);
        const idx = vipLevels.findIndex((v, i) => {
          const nxt = vipLevels[i + 1];
          return !nxt || exp < nxt.minExp;
        });
        setCurrentLevel(Math.max(1, idx + 1));
      }
      if (c.data) {
        setClaimedRewards(c.data as ClaimedReward[]);
        setHistory(
          (c.data as any[]).slice(0, 6).map((r) => ({
            label: r.reward_type === "level_up" ? "Level Up Reward Claimed" : "Monthly Reward Claimed",
            amount: bdt(r.amount || 0),
            date: new Date(r.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
            type: r.reward_type,
          })),
        );
      }
    } catch (e) { console.error(e); }
  };

  const isLevelUpClaimed = (l: number) => claimedRewards.some(c => c.reward_type === "level_up" && c.vip_level === l);
  const isMonthlyClaimed = (l: number) => {
    const m = getCurrentMonth();
    return claimedRewards.some(c => c.reward_type === "monthly" && c.vip_level === l && c.claim_month === m);
  };

  const claimLevelUp = async () => {
    if (!userId || claimingLevelUp) return;
    const vip = vipLevels[currentLevel - 1];
    if (isLevelUpClaimed(currentLevel)) { toast({ title: "Already Claimed" } as any); return; }
    setClaimingLevelUp(true);
    try {
      const { data, error } = await supabase.rpc("credit_reward", {
        p_user_id: userId, p_amount: vip.levelUpReward,
        p_reward_type: "vip_level_up", p_reason: `VIP${currentLevel} Level Up Reward`,
      });
      const r = data as { success: boolean; error?: string } | null;
      if (error || !r?.success) throw new Error(r?.error || "Failed");
      await supabase.from("vip_reward_claims").insert({ user_id: userId, reward_type: "level_up", vip_level: currentLevel, amount: vip.levelUpReward });
      setClaimedRewards(p => [...p, { reward_type: "level_up", vip_level: currentLevel, claim_month: null }]);
      toast({ title: "🎉 Reward Claimed", description: `${bdt(vip.levelUpReward)} credited.` } as any);
    } catch (e: any) {
      toast({ title: "Claim Failed", description: e.message, variant: "destructive" } as any);
    } finally { setClaimingLevelUp(false); }
  };

  const claimMonthly = async () => {
    if (!userId || claimingMonthly) return;
    const vip = vipLevels[currentLevel - 1];
    if (vip.monthlyReward <= 0 || isMonthlyClaimed(currentLevel)) { toast({ title: "Not Available" } as any); return; }
    setClaimingMonthly(true);
    try {
      const m = getCurrentMonth();
      const { data, error } = await supabase.rpc("credit_reward", {
        p_user_id: userId, p_amount: vip.monthlyReward,
        p_reward_type: "vip_monthly", p_reason: `VIP${currentLevel} Monthly Reward`,
      });
      const r = data as { success: boolean; error?: string } | null;
      if (error || !r?.success) throw new Error(r?.error || "Failed");
      await supabase.from("vip_reward_claims").insert({ user_id: userId, reward_type: "monthly", vip_level: currentLevel, amount: vip.monthlyReward, claim_month: m });
      setClaimedRewards(p => [...p, { reward_type: "monthly", vip_level: currentLevel, claim_month: m }]);
      toast({ title: "🎉 Monthly Claimed", description: `${bdt(vip.monthlyReward)} credited.` } as any);
    } catch (e: any) {
      toast({ title: "Claim Failed", description: e.message, variant: "destructive" } as any);
    } finally { setClaimingMonthly(false); }
  };

  const cur = vipLevels[currentLevel - 1];
  const nxt = vipLevels[currentLevel];
  const progress = nxt ? Math.min(100, Math.max(0, ((totalExp - cur.minExp) / (nxt.minExp - cur.minExp)) * 100)) : 100;
  const maxRewards = vipLevels[vipLevels.length - 1].monthlyReward;

  const compareRows = useMemo(() => {
    const start = Math.max(0, currentLevel - 3);
    return vipLevels.slice(start, Math.min(vipLevels.length, start + 6));
  }, [currentLevel]);

  return (
    <div className="min-h-screen pb-28" style={{ background: "#04060A" }}>
      <Seo title="GoLucky VIP Club — Premium Pro Max 2026" description="Climb 10 VIP tiers for exclusive monthly rewards, rebates, and safe bonuses." path="/vip" />

      <div className="mx-auto w-full max-w-[430px] px-3 pt-3">
        {/* ============ TOP BAR ============ */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <button onClick={() => navigate(-1)} className="grid h-10 w-10 place-items-center rounded-full border" style={{ borderColor: "rgba(244,180,25,0.4)", background: "#000" }} aria-label="Menu">
            <Menu className="h-5 w-5" style={{ color: GOLD }} />
          </button>
          <img src={goluckyTextLogo} alt="GoLucky" className="h-9 w-auto" />
          <div className="flex items-center gap-2 rounded-full border px-2 py-1" style={{ borderColor: "rgba(244,180,25,0.5)", background: "#000" }}>
            <div className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-black text-black" style={{ background: `linear-gradient(180deg,${GOLD_SOFT},${GOLD})` }}>G</div>
            <span className="text-[12px] font-black text-white">GLC {(balance ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <div className="grid h-5 w-5 place-items-center rounded-full" style={{ background: GREEN }}><Plus className="h-3 w-3 text-black" strokeWidth={4} /></div>
          </div>
          <button className="relative grid h-10 w-10 place-items-center rounded-full border" style={{ borderColor: "rgba(244,180,25,0.4)", background: "#000" }} aria-label="Notifications">
            <Bell className="h-5 w-5 text-white" />
            <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full text-[9px] font-black text-white" style={{ background: "#EF4444" }}>8</span>
          </button>
          <button className="grid h-10 w-10 place-items-center rounded-full border" style={{ borderColor: "rgba(244,180,25,0.4)", background: "#000" }} aria-label="Profile">
            <UserIcon className="h-5 w-5" style={{ color: GOLD }} />
            <span className="absolute mt-6 ml-6 h-2 w-2 rounded-full" style={{ background: GREEN }} />
          </button>
        </div>

        {/* ============ HERO CARD ============ */}
        <section className="relative overflow-hidden rounded-2xl p-4" style={{ background: CARD_BG, border: CARD_BORDER, boxShadow: CARD_SHADOW }}>
          {/* Sparkles */}
          <div className="pointer-events-none absolute inset-0 opacity-40" style={{ background: "radial-gradient(60% 40% at 10% 0%, rgba(244,180,25,0.18), transparent 60%)" }} />
          <div className="flex gap-3">
            {/* Big shield */}
            <div className="flex flex-col items-center pt-1 shrink-0" style={{ width: 108 }}>
              <div className="relative" style={{ width: 108, height: 118 }}>
                <Crown className="absolute left-1/2 -top-1 -translate-x-1/2 h-8 w-8 z-10" style={{ color: GOLD_SOFT, filter: `drop-shadow(0 0 6px ${GOLD})` }} fill={GOLD} />
                <div
                  className="absolute left-1/2 top-2 -translate-x-1/2 grid place-items-center"
                  style={{
                    width: 104, height: 116,
                    background: "linear-gradient(180deg,#FFE58A 0%,#F4B419 40%,#7a4e00 100%)",
                    clipPath: "polygon(50% 0,100% 18%,100% 66%,50% 100%,0 66%,0 18%)",
                    boxShadow: "0 0 28px rgba(244,180,25,0.65)",
                  }}
                >
                  <div className="grid place-items-center" style={{ width: 92, height: 104, background: "linear-gradient(180deg,#1a1000,#0a0600)", clipPath: "polygon(50% 0,100% 18%,100% 66%,50% 100%,0 66%,0 18%)" }}>
                    <div className="text-center leading-none">
                      <div className="text-[12px] font-black tracking-wider" style={{ color: GOLD_SOFT }}>VIP</div>
                      <div className="text-[38px] font-black mt-1" style={{ color: GOLD_SOFT, textShadow: `0 0 10px ${GOLD}` }}>{currentLevel}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-2 rounded-md px-2.5 py-1 text-[10px] font-black tracking-wider whitespace-nowrap" style={{ color: "#1a1000", background: `linear-gradient(180deg,${GOLD_SOFT},${GOLD})`, boxShadow: `0 0 10px rgba(244,180,25,0.5)` }}>CURRENT LEVEL</div>
            </div>

            {/* Right side */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h1 className="text-[15px] font-black leading-tight text-white">GoLucky Premium Pro Max 2026 <span style={{ color: GOLD_SOFT }}>Ultra</span></h1>
                <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black text-black" style={{ background: `linear-gradient(180deg,${GOLD_SOFT},${GOLD})` }}>Ultra</span>
              </div>
              <p className="mt-1 flex items-center gap-1 text-[11px] text-white/70">
                <Sparkles className="h-3 w-3" style={{ color: GOLD }} /> Enjoy unlimited premium benefits & rewards
              </p>

              {/* Progress mini card */}
              <div className="mt-3 rounded-xl p-2.5" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(244,180,25,0.2)" }}>
                <div className="flex items-center justify-between text-[10px] text-white/60">
                  <span>Current EXP</span><span>Next Level (VIP {Math.min(10, currentLevel + 1)})</span>
                </div>
                <div className="mt-0.5 flex items-center justify-between">
                  <span className="text-[13px] font-black" style={{ color: GREEN }}>{fmtExp(totalExp)} EXP</span>
                  <span className="text-[13px] font-black text-white">{fmtExp(nxt?.minExp ?? cur.minExp)} EXP</span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full" style={{ background: "#1A1F2E" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${progress}%`,
                      background: `linear-gradient(90deg,${GREEN} 0%,${GOLD_SOFT} 60%,${GOLD} 100%)`,
                      boxShadow: `0 0 10px ${GOLD}`,
                    }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1 text-white/60"><TrendingUp className="h-3 w-3" style={{ color: GOLD }} /> EXP Progress</span>
                  <span className="font-black" style={{ color: GREEN }}>{progress.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mini stats row */}
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {[
              { icon: <Crown className="h-3 w-3" style={{ color: GOLD }} fill={GOLD} />, label: "MAX LEVEL", value: "VIP 10" },
              { icon: <Gift className="h-3 w-3" style={{ color: GOLD }} />, label: "Monthly Rewards", value: `Up to ${bdt(maxRewards)}` },
              { icon: <Shield className="h-3 w-3" style={{ color: GOLD }} />, label: "Safe Bonus", value: "Up to 0.4%" },
              { icon: <Percent className="h-3 w-3" style={{ color: GOLD }} />, label: "Rebate Rate", value: "Up to 0.8%" },
            ].map((s, i) => (
              <div key={i} className="rounded-lg px-1.5 py-1.5" style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(244,180,25,0.15)" }}>
                <div className="flex items-center gap-1">{s.icon}<span className="text-[8px] uppercase tracking-wider text-white/50">{s.label}</span></div>
                <div className="mt-0.5 text-[10px] font-black text-white">{s.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ============ VIP LEVELS ROW ============ */}
        <section className="mt-3 rounded-2xl p-4" style={{ background: CARD_BG, border: CARD_BORDER, boxShadow: CARD_SHADOW }}>
          <SectionTitle>VIP LEVELS</SectionTitle>
          <div className="flex items-center justify-between gap-0.5 pb-1">
            {vipLevels.map((lv, i) => {
              const state: "achieved" | "current" | "locked" =
                lv.level < currentLevel ? "achieved" : lv.level === currentLevel ? "current" : "locked";
              return (
                <div key={lv.level} className="flex items-center">
                  <VIPShield level={lv.level} state={state} size={state === "current" ? 44 : 30} showCrown={lv.level === 10 || state === "current"} />
                  {i < vipLevels.length - 1 && (
                    <ChevronRight className="mx-[1px] h-3 w-3 shrink-0" style={{ color: lv.level < currentLevel ? GREEN : "rgba(255,255,255,0.2)" }} />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ============ BENEFITS PREVIEW ============ */}
        <section className="mt-3 rounded-2xl p-4" style={{ background: CARD_BG, border: CARD_BORDER, boxShadow: CARD_SHADOW }}>
          <SectionTitle>VIP {currentLevel} BENEFITS PREVIEW</SectionTitle>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Gift, title: "Level Up Reward", value: bdt(cur.levelUpReward), sub: "One-time reward", color: "#B855F5", ring: "rgba(184,85,245,0.7)" },
              { icon: Diamond, title: "Monthly Reward", value: bdt(cur.monthlyReward), sub: "Every month", color: "#3AA3FF", ring: "rgba(58,163,255,0.7)" },
              { icon: Shield, title: "Safe Bonus", value: `${cur.safePercent.toFixed(2)}%`, sub: "Extra income", color: GREEN, ring: "rgba(34,197,94,0.7)" },
              { icon: TrendingUp, title: "Rebate Rate", value: `${cur.rebateRate.toFixed(2)}%`, sub: "From total rebate", color: GOLD, ring: "rgba(244,180,25,0.7)" },
            ].map((b, i) => (
              <div key={i} className="flex flex-col items-center rounded-xl px-1.5 py-3 text-center" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="grid h-14 w-14 place-items-center rounded-full" style={{ background: "rgba(0,0,0,0.7)", border: `2px solid ${b.ring}`, boxShadow: `0 0 14px ${b.ring}` }}>
                  <b.icon className="h-7 w-7" style={{ color: b.color, filter: `drop-shadow(0 0 4px ${b.ring})` }} />
                </div>
                <div className="mt-2 text-[10px] font-bold text-white/80">{b.title}</div>
                <div className="text-[16px] font-black leading-tight" style={{ color: b.color }}>{b.value}</div>
                <div className="mt-0.5 text-[9px] text-white/45">{b.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ============ CLAIM REWARDS ============ */}
        <section className="mt-3 rounded-2xl p-4" style={{ background: CARD_BG, border: CARD_BORDER, boxShadow: CARD_SHADOW }}>
          <SectionTitle>CLAIM REWARDS</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {/* Level Up */}
            <div className="overflow-hidden rounded-xl p-3" style={{ background: "linear-gradient(180deg,#3A2266 0%,#1E1233 100%)", border: "1px solid rgba(184,85,245,0.4)" }}>
              <div className="flex items-start gap-2">
                <div className="text-3xl leading-none">🎁</div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-black text-white">Level Up Reward</div>
                  <div className="mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-black" style={{ background: "rgba(34,197,94,0.2)", color: GREEN }}>
                    {isLevelUpClaimed(currentLevel) ? "Claimed" : "Ready to Claim"}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-[22px] font-black leading-none" style={{ color: GOLD_SOFT, textShadow: `0 0 10px rgba(244,180,25,0.5)` }}>{bdt(cur.levelUpReward)}</div>
              <button
                onClick={claimLevelUp}
                disabled={claimingLevelUp || isLevelUpClaimed(currentLevel)}
                className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg py-2.5 text-[12px] font-black text-white disabled:opacity-60"
                style={{ background: "linear-gradient(180deg,#8A3FF0,#5820AE)" }}
              >
                {claimingLevelUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Claim Reward <ChevronRight className="h-3.5 w-3.5" /></>}
              </button>
            </div>
            {/* Monthly */}
            <div className="overflow-hidden rounded-xl p-3" style={{ background: "linear-gradient(180deg,#123A5B 0%,#0A1F30 100%)", border: "1px solid rgba(58,163,255,0.4)" }}>
              <div className="flex items-start gap-2">
                <div className="text-3xl leading-none">💰</div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-black text-white">Monthly Reward</div>
                  <div className="mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-black" style={{ background: "rgba(58,163,255,0.2)", color: "#7EC0FF" }}>
                    {isMonthlyClaimed(currentLevel) ? "Claimed" : cur.monthlyReward > 0 ? "Available" : "Not Available"}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-[22px] font-black leading-none" style={{ color: GOLD_SOFT, textShadow: `0 0 10px rgba(244,180,25,0.5)` }}>{bdt(cur.monthlyReward)}</div>
              <button
                onClick={claimMonthly}
                disabled={claimingMonthly || isMonthlyClaimed(currentLevel) || cur.monthlyReward <= 0}
                className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg py-2.5 text-[12px] font-black text-white disabled:opacity-60"
                style={{ background: "linear-gradient(180deg,#2E7BD6,#134A99)" }}
              >
                {claimingMonthly ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Claim Monthly <ChevronRight className="h-3.5 w-3.5" /></>}
              </button>
            </div>
          </div>
        </section>

        {/* ============ COMPARISON TABLE ============ */}
        <section className="mt-3 rounded-2xl p-4" style={{ background: CARD_BG, border: CARD_BORDER, boxShadow: CARD_SHADOW }} ref={cmpRef}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[12px] font-black uppercase tracking-wider" style={{ color: GOLD_SOFT }}>VIP LEVEL COMPARISON</h3>
            <button className="flex items-center gap-1 rounded-md border px-2 py-1 text-[9px] font-black" style={{ color: GOLD, borderColor: "rgba(244,180,25,0.4)" }}>
              Compare Benefits <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="text-left text-white/60">
                  <th className="py-1.5 font-bold">VIP Level</th>
                  <th className="py-1.5 font-bold"><span className="mr-1">🎁</span>Level Up Reward</th>
                  <th className="py-1.5 font-bold"><Diamond className="mr-1 inline h-3 w-3" style={{ color: "#3AA3FF" }} />Monthly Reward</th>
                  <th className="py-1.5 font-bold"><Shield className="mr-1 inline h-3 w-3" style={{ color: GREEN }} />Safe Bonus</th>
                  <th className="py-1.5 font-bold"><Percent className="mr-1 inline h-3 w-3" style={{ color: GOLD }} />Rebate Rate</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((r) => {
                  const active = r.level === currentLevel;
                  return (
                    <tr key={r.level} className="border-t" style={{
                      borderColor: "rgba(255,255,255,0.06)",
                      background: active ? "rgba(244,180,25,0.10)" : "transparent",
                      color: active ? GOLD_SOFT : "rgba(255,255,255,0.85)",
                    }}>
                      <td className="py-1.5 font-black">VIP {r.level}</td>
                      <td className="py-1.5">{bdt(r.levelUpReward)}</td>
                      <td className="py-1.5">{bdt(r.monthlyReward)}</td>
                      <td className="py-1.5">{r.safePercent.toFixed(2)}%</td>
                      <td className="py-1.5">{r.rebateRate.toFixed(2)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ============ HISTORY + RULES ============ */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <section className="rounded-2xl p-3" style={{ background: CARD_BG, border: CARD_BORDER, boxShadow: CARD_SHADOW }}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[11px] font-black uppercase tracking-wider" style={{ color: GOLD_SOFT }}>Reward History</h3>
              <button className="text-[9px] font-black" style={{ color: GREEN }}>View All</button>
            </div>
            <div className="space-y-2">
              {history.length === 0 && (
                <div className="py-4 text-center text-[10px] text-white/40">No rewards claimed yet</div>
              )}
              {history.map((h, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="mt-0.5 text-sm">{h.type === "level_up" ? "🎁" : "💎"}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold text-white">{h.label}</div>
                    <div className="text-[9px] text-white/45">{h.date}</div>
                  </div>
                  <div className="text-[11px] font-black" style={{ color: GREEN }}>+ {h.amount}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl p-3" style={{ background: CARD_BG, border: CARD_BORDER, boxShadow: CARD_SHADOW }}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[11px] font-black uppercase tracking-wider" style={{ color: GOLD_SOFT }}>VIP Rules</h3>
              <button className="text-[9px] font-black" style={{ color: GREEN }}>View All</button>
            </div>
            <ul className="space-y-1.5 text-[10px] text-white/80">
              {[
                "Level Up Reward can be claimed only one time.",
                "Monthly Reward can be claimed once per month.",
                "Safe Bonus will be added automatically.",
                "Rebate will be calculated daily.",
                "If EXP falls below the required amount, VIP level may be downgraded.",
              ].map((t, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="mt-0.5 text-[10px]" style={{ color: GOLD }}>◆</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* ============ BOTTOM BANNER ============ */}
        <section className="mt-3 rounded-2xl p-4" style={{ background: CARD_BG, border: CARD_BORDER, boxShadow: CARD_SHADOW }}>
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <Crown className="absolute left-1/2 -top-3 -translate-x-1/2 h-5 w-5" style={{ color: GOLD_SOFT }} fill={GOLD} />
              <div
                className="grid h-16 w-14 place-items-center"
                style={{
                  background: "linear-gradient(180deg,#FFE082,#F4B419 45%,#7a4e00)",
                  clipPath: "polygon(50% 0,100% 18%,100% 66%,50% 100%,0 66%,0 18%)",
                }}
              >
                <Trophy className="h-6 w-6 text-[#1a1000]" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-[13px] font-black text-white leading-tight">GoLucky Premium Pro Max 2026 Ultra</h4>
              <p className="text-[10px] text-white/60">Unlock VIP 10 and enjoy all exclusive privileges</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <button onClick={() => navigate("/promotion")} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-black text-black" style={{ background: `linear-gradient(180deg,${GOLD_SOFT},${GOLD})` }}>
                Upgrade VIP <ChevronRight className="h-3 w-3" />
              </button>
              <span className="text-[9px] font-black" style={{ color: GREEN }}>Reach VIP 10 Now!</span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-1 text-center">
            {[
              { i: "💰", t: "Higher Cashback" },
              { i: "⚡", t: "Instant Withdraw" },
              { i: "🎧", t: "24/7 Support" },
              { i: "🎟️", t: "Exclusive Events" },
              { i: "👑", t: "VIP Manager" },
            ].map((b, i) => (
              <div key={i} className="rounded-lg py-1.5" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(244,180,25,0.15)" }}>
                <div className="text-base">{b.i}</div>
                <div className="text-[8px] font-bold text-white/70">{b.t}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default VIP;
