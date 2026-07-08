/**
 * History Service — persists recent results per (game, market) in localStorage.
 * Backed by the same scheme used across the engine so all modules read the
 * same source. Future: swap to Supabase-backed fetcher without touching UI.
 */
import type { GameId, GameResult, Market } from "./types";

const KEY = (g: GameId, m: Market) => `golucky:engine:history:${g}:${m}`;
const MAX = 100;

export const historyService = {
  load(g: GameId, m: Market): GameResult[] {
    try {
      const raw = localStorage.getItem(KEY(g, m));
      return raw ? (JSON.parse(raw) as GameResult[]) : [];
    } catch {
      return [];
    }
  },
  append(result: GameResult): GameResult[] {
    const list = historyService.load(result.gameId, result.market);
    if (list.some((r) => r.tradeId === result.tradeId)) return list;
    const next = [result, ...list].slice(0, MAX);
    try {
      localStorage.setItem(KEY(result.gameId, result.market), JSON.stringify(next));
    } catch {/* quota */}
    return next;
  },
  clear(g: GameId, m: Market) {
    localStorage.removeItem(KEY(g, m));
  },
};
