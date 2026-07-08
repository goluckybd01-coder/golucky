import React from "react";
import type { GameResult } from "@/engine";

const HistoryTable: React.FC<{ results: GameResult[] }> = ({ results }) => (
  <section className="mx-3 mt-3 rounded-3xl bg-card shadow-sm border border-border/50 overflow-hidden">
    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
      <h2 className="text-sm font-bold">📜 History</h2>
      <span className="text-[10px] text-muted-foreground">{results.length} rounds</span>
    </div>
    <div className="max-h-72 overflow-y-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-muted/60 backdrop-blur text-[10px] uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left">Period</th>
            <th className="px-3 py-2 text-center">Result</th>
            <th className="px-3 py-2 text-right">B/S</th>
            <th className="px-3 py-2 text-right">O/E</th>
          </tr>
        </thead>
        <tbody>
          {results.slice(0, 50).map((r) => {
            const p = r.payload as { bigSmall?: string; oddEven?: string };
            return (
              <tr key={r.tradeId} className="border-t border-border/30">
                <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">{r.tradeId.slice(-8)}</td>
                <td className="px-3 py-2 text-center font-bold">{r.headline}</td>
                <td className="px-3 py-2 text-right text-[10px]">{p.bigSmall ?? "-"}</td>
                <td className="px-3 py-2 text-right text-[10px]">{p.oddEven ?? "-"}</td>
              </tr>
            );
          })}
          {results.length === 0 && (
            <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">No history yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
);
export default HistoryTable;
