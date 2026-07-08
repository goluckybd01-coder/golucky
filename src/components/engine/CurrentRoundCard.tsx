import React from "react";
import type { RoundInfo, CountdownState } from "@/engine";
import CountdownTimer from "./CountdownTimer";

interface Props { round: RoundInfo; countdown: CountdownState; marketLabel: string }
const CurrentRoundCard: React.FC<Props> = ({ round, countdown, marketLabel }) => (
  <div className="mx-3 rounded-3xl bg-gradient-to-br from-card via-card to-card/80 p-4 shadow-lg border border-border/50">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{marketLabel} • Current Round</p>
        <p className="mt-1 font-mono text-base font-bold text-foreground">{round.tradeId}</p>
      </div>
      <CountdownTimer countdown={countdown} />
    </div>
  </div>
);
export default CurrentRoundCard;
