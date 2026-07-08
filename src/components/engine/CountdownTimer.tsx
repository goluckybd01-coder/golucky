import React from "react";
import type { CountdownState } from "@/engine";
import { cn } from "@/lib/utils";

interface Props { countdown: CountdownState }
const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return [mm[0], mm[1], ss[0], ss[1]];
};
const CountdownTimer: React.FC<Props> = ({ countdown }) => {
  const digits = fmt(countdown.remainingMs);
  const pct = (countdown.remainingMs / countdown.totalMs) * 100;
  return (
    <div className="flex flex-col items-center gap-2">
      <p className={cn("text-[10px] font-bold uppercase tracking-widest", countdown.locked ? "text-destructive" : "text-muted-foreground")}>
        {countdown.locked ? "Betting Locked" : "Time Remaining"}
      </p>
      <div className="flex items-center gap-1">
        {digits.map((d, i) => (
          <React.Fragment key={i}>
            <span className={cn(
              "flex h-10 w-7 items-center justify-center rounded-lg font-mono text-xl font-bold shadow-inner",
              countdown.locked
                ? "bg-destructive text-destructive-foreground animate-pulse"
                : "bg-gradient-to-b from-foreground to-foreground/80 text-background"
            )}>{d}</span>
            {i === 1 && <span className="text-base font-bold text-muted-foreground">:</span>}
          </React.Fragment>
        ))}
      </div>
      <div className="h-1 w-32 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};
export default CountdownTimer;
