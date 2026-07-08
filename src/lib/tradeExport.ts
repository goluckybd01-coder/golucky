export const PAYOUT = 0.85;

export type ExportTrade = {
  id: number;
  asset: string;
  symbol: string;
  dir: "UP" | "DOWN";
  stake?: number;
  potentialWin?: number;
  result: "win" | "loss";
  payout?: number;
  forced?: "UP" | "DOWN" | null;
  startPrice?: number;
  endPrice?: number;
  at: string;
  duration?: number;
  payoutRatio?: number;
};

export function calculateTradePnl(trade: ExportTrade): number {
  return trade.result === "win"
    ? Math.abs(trade.payout ?? (trade.stake ?? 0) * (1 + PAYOUT))
    : -Math.abs(trade.stake ?? 0);
}

export function safeFilenameSegment(value: string): string {
  return value.replace(/[^a-z0-9._-]+/gi, "_").replace(/^_+|_+$/g, "") || "asset";
}

export function buildTradesCSV(trades: ExportTrade[]): string {
  const headers = ["id","time","asset","symbol","direction","stake","payout_ratio","payout","result","pnl","start_price","end_price","duration_s","forced"];
  const rows = trades.map(t => [
    t.id, t.at, t.asset, t.symbol, t.dir, (t.stake ?? 0).toFixed(2),
    t.payoutRatio ?? PAYOUT, (t.payout ?? 0).toFixed(2), t.result,
    calculateTradePnl(t).toFixed(2),
    t.startPrice ?? "", t.endPrice ?? "", t.duration ?? "", t.forced ?? "",
  ]);
  return [headers, ...rows]
    .map(r => r.map(v => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(","))
    .join("\n");
}

export function summarizeTrades(trades: ExportTrade[]) {
  const totals = trades.reduce(
    (acc, t) => {
      const pnl = calculateTradePnl(t);
      acc.stake += t.stake ?? 0;
      acc.payout += t.result === "win" ? Math.abs(t.payout ?? 0) : 0;
      acc.pnl += pnl;
      if (t.result === "win") acc.wins += 1; else acc.losses += 1;
      return acc;
    },
    { stake: 0, payout: 0, pnl: 0, wins: 0, losses: 0 }
  );
  const winRate = trades.length ? (totals.wins / trades.length) * 100 : 0;
  return { ...totals, winRate };
}

export function buildTradesPDFHtml(trades: ExportTrade[], assetSymbol: string): string {
  const totals = summarizeTrades(trades);
  const winRate = totals.winRate.toFixed(1);
  const rows = trades.map(t => {
    const pnl = calculateTradePnl(t);
    return `<tr><td>${new Date(t.at).toLocaleString()}</td><td>${t.symbol}</td><td>${t.dir}</td><td>$${(t.stake ?? 0).toFixed(2)}</td><td>${t.result.toUpperCase()}</td><td style="color:${pnl>=0?'#059669':'#dc2626'}">${pnl>=0?'+':''}$${pnl.toFixed(2)}</td><td>${t.startPrice ?? "-"}</td><td>${t.endPrice ?? "-"}</td></tr>`;
  }).join("");
  const tfoot = `<tfoot><tr><td colspan="3">Totals (${trades.length} trades · ${totals.wins}W / ${totals.losses}L · ${winRate}% win rate)</td><td>$${totals.stake.toFixed(2)}</td><td>Payout: $${totals.payout.toFixed(2)}</td><td>${totals.pnl>=0?'+':''}$${totals.pnl.toFixed(2)}</td><td colspan="2"></td></tr></tfoot>`;
  return `<!doctype html><html><body><h1>GoLucky Trade History</h1><div>Asset: <b>${assetSymbol}</b> · Total trades: ${trades.length}</div><table><thead><tr><th>Time</th><th>Symbol</th><th>Dir</th><th>Stake</th><th>Result</th><th>P&amp;L</th><th>Start</th><th>End</th></tr></thead><tbody>${rows}</tbody>${tfoot}</table></body></html>`;
}
