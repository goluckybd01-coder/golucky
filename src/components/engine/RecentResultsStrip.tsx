import React from "react";
import type { GameResult } from "@/engine";

const RecentResultsStrip: React.FC<{ results: GameResult[] }> = ({ results }) => (
  <section className="mx-3 mt-3 rounded-3xl border border-amber-400/20 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-amber-950/30 p-4 shadow-[0_8px_32px_-12px_rgba(245,158,11,0.25)] backdrop-blur-xl">
    <div className="mb-3 flex items-center justify-between">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
        ✨ Recent Results
      </p>
      <span className="text-[10px] text-amber-200/60">Last {Math.min(results.length, 20)}</span>
    </div>
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
      {results.slice(0, 20).map((r) => (
        <div
          key={r.tradeId}
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-gradient-to-br from-amber-500/15 via-yellow-600/10 to-amber-900/20 font-bold text-sm text-amber-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_2px_8px_rgba(245,158,11,0.15)] backdrop-blur-md transition-transform hover:scale-110"
          title={r.tradeId}
        >
          {r.headline}
        </div>
      ))}
      {results.length === 0 && <p className="text-xs text-amber-200/50">Waiting for first result…</p>}
    </div>
  </section>
);
export default RecentResultsStrip;
