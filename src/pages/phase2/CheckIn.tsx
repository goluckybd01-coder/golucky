import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Gift, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

const REWARDS = [10, 20, 30, 50, 75, 100, 200];

interface Streak {
  current_streak: number;
  longest_streak: number;
  last_claim_date: string | null;
  total_claims: number;
}

export default function CheckIn() {
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const claimedToday = streak?.last_claim_date === today;
  const nextDayIdx = streak ? (streak.current_streak % 7) : 0;

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setLoading(false);
    const { data } = await supabase
      .from("p2_checkin_streaks" as never)
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setStreak((data as Streak) ?? { current_streak: 0, longest_streak: 0, last_claim_date: null, total_claims: 0 });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const claim = async () => {
    setClaiming(true);
    const { data, error } = await supabase.rpc("p2_claim_checkin" as never);
    setClaiming(false);
    if (error) return toast.error(error.message.replace(/_/g, " "));
    const res = data as { reward_amount: number; streak: number };
    toast.success(`Claimed ৳${res.reward_amount}! Streak: ${res.streak} 🔥`);
    load();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white p-4 pb-24">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6 pt-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Daily Check-In
          </h1>
          <p className="text-white/60 text-sm mt-2">Claim your reward every day. Higher streak = higher reward.</p>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-5 mb-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <Flame className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-white/50 uppercase tracking-wider">Current Streak</div>
            <div className="text-3xl font-bold">{streak?.current_streak ?? 0} days</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/50">Best</div>
            <div className="text-lg font-bold text-amber-400">{streak?.longest_streak ?? 0}</div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-5">
          {REWARDS.map((r, i) => {
            const claimed = i < nextDayIdx;
            const isToday = i === nextDayIdx && !claimedToday;
            return (
              <div
                key={i}
                className={`aspect-square rounded-xl border p-1.5 flex flex-col items-center justify-center text-center transition ${
                  claimed
                    ? "bg-emerald-500/20 border-emerald-500/40"
                    : isToday
                    ? "bg-amber-500/20 border-amber-500/60 ring-2 ring-amber-400/50 animate-pulse"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <div className="text-[9px] text-white/60">D{i + 1}</div>
                {claimed ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Gift className="w-4 h-4 text-amber-400" />
                )}
                <div className="text-[10px] font-bold">৳{r}</div>
              </div>
            );
          })}
        </div>

        <button
          onClick={claim}
          disabled={claimedToday || claiming}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition"
        >
          {claiming ? "Claiming..." : claimedToday ? "Come back tomorrow" : `Claim ৳${REWARDS[nextDayIdx]}`}
        </button>

        <div className="text-center text-xs text-white/40 mt-4">
          Total lifetime claims: {streak?.total_claims ?? 0}
        </div>
      </div>
    </div>
  );
}
