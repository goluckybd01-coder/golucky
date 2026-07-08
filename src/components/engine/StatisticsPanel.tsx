import React from "react";
import type { Stats } from "@/engine";

const Bar: React.FC<{ label: string; a: number; b: number; aLabel: string; bLabel: string }> = ({ a, b, aLabel, bLabel }) => {
  const total = a + b || 1;
  const ap = Math.round((a / total) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
        <span>{aLabel} {ap}%</span><span>{100 - ap}% {bLabel}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted flex">
        <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: `${ap}%` }} />
        <div className="h-full bg-gradient-to-r from-rose-500 to-rose-400 flex-1" />
      </div>
    </div>
  );
};

const StatisticsPanel: React.FC<{ stats: Stats }> = ({ stats }) => (
  <section className="mx-3 mt-3 rounded-3xl bg-card p-4 shadow-sm border border-border/50">
    <h2 className="mb-3 text-sm font-bold">📊 Statistics ({stats.total} rounds)</h2>
    {stats.total === 0 ? (
      <p className="text-xs text-muted-foreground">Waiting for first results…</p>
    ) : (
      <div className="space-y-3">
        <Bar label="bs" a={stats.big} b={stats.small} aLabel="Big" bLabel="Small" />
        <Bar label="oe" a={stats.odd} b={stats.even} aLabel="Odd" bLabel="Even" />
      </div>
    )}
  </section>
);
export default StatisticsPanel;
