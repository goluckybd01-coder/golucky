import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBDT, formatInt } from "./MetricTile";

interface GameStat {
  total_bets: number;
  total_win: number;
  total_lose: number;
  total_stake: number;
  house_profit: number;
  rtp: number;
  active_players: number;
}

interface GameStatCardProps {
  title: string;
  stat?: GameStat;
}

const empty: GameStat = {
  total_bets: 0,
  total_win: 0,
  total_lose: 0,
  total_stake: 0,
  house_profit: 0,
  rtp: 0,
  active_players: 0,
};

export function GameStatCard({ title, stat }: GameStatCardProps) {
  const s = stat ?? empty;
  const profitTone = s.house_profit >= 0 ? "text-emerald-500" : "text-rose-500";
  return (
    <Card className="p-4 border border-border/60">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Badge variant="outline" className="text-[10px]">
          RTP {s.rtp.toFixed(1)}%
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <Stat label="Bets" value={formatInt(s.total_bets)} />
        <Stat label="Active" value={formatInt(s.active_players)} />
        <Stat label="Win" value={formatInt(s.total_win)} className="text-emerald-500" />
        <Stat label="Lose" value={formatInt(s.total_lose)} className="text-rose-500" />
        <Stat label="Stake" value={formatBDT(s.total_stake)} />
        <Stat label="House P/L" value={formatBDT(s.house_profit)} className={profitTone} />
      </div>
    </Card>
  );
}

function Stat({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold tabular-nums ${className}`}>{value}</span>
    </div>
  );
}
