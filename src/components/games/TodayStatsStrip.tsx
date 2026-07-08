import { useEffect, useState } from "react";
import { Dice5, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Bucket = { count: number; total: number };
type Payload = {
  bets: Bucket;
  deposits: Bucket;
  withdrawals: Bucket;
  generated_at: string;
};

const SEED: Payload = {
  bets: { count: 0, total: 0 },
  deposits: { count: 0, total: 0 },
  withdrawals: { count: 0, total: 0 },
  generated_at: new Date().toISOString(),
};

function fmtBDT(n: number): string {
  if (n >= 1e7) return `৳${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `৳${(n / 1e5).toFixed(2)} L`;
  if (n >= 1e3) return `৳${(n / 1e3).toFixed(1)} K`;
  return `৳${Math.round(n).toLocaleString("en-IN")}`;
}

const CARDS = [
  { key: "bets" as const,        label: "Today's Bets",        icon: Dice5,            color: "#FEC013" },
  { key: "deposits" as const,    label: "Today's Deposits",    icon: ArrowDownToLine,  color: "#12C665" },
  { key: "withdrawals" as const, label: "Today's Withdrawals", icon: ArrowUpFromLine,  color: "#02B4FA" },
];

export default function TodayStatsStrip() {
  const [data, setData] = useState<Payload>(SEED);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data, error } = await supabase.functions.invoke<Payload>(
          "games-today-stats",
        );
        if (error || !data) throw error ?? new Error("no data");
        if (cancelled) return;
        setData(data);
        setLive(true);
      } catch {
        if (!cancelled) setLive(false);
      }
    };
    load();
    const id = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <div
      role="group"
      aria-label="Today's platform activity"
      className="grid grid-cols-3 gap-2"
    >
      {CARDS.map(({ key, label, icon: Icon, color }) => {
        const b = data[key];
        return (
          <div
            key={key}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-2.5"
            style={{
              boxShadow: `0 10px 24px -18px ${color}aa, inset 0 1px 0 rgba(255,255,255,0.05)`,
            }}
          >
            <div className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="inline-flex h-5 w-5 items-center justify-center rounded-md"
                style={{ background: `${color}22`, color }}
              >
                <Icon className="h-3 w-3" />
              </span>
              <span className="text-[9px] font-black uppercase tracking-wider text-white/70 truncate">
                {label}
              </span>
              {live && (
                <span
                  aria-label="Live"
                  className="ml-auto h-1.5 w-1.5 rounded-full"
                  style={{ background: "#12C665", boxShadow: "0 0 6px #12C665" }}
                />
              )}
            </div>
            <div
              className="mt-1.5 text-[15px] font-black tabular-nums leading-none"
              style={{ color }}
            >
              {fmtBDT(b.total)}
            </div>
            <div className="mt-0.5 text-[9.5px] text-white/55 tabular-nums">
              {b.count.toLocaleString("en-IN")} txns
            </div>
          </div>
        );
      })}
    </div>
  );
}
