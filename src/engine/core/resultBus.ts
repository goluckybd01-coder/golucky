/**
 * Lightweight pub/sub for round settlement events.
 * Engine emits, UI components subscribe.
 */
import type { GameId, GameResult, Market } from "./types";

type Key = string;
type Listener = (r: GameResult) => void;

const key = (g: GameId, m: Market) => `${g}:${m}`;
const listeners = new Map<Key, Set<Listener>>();

export const resultBus = {
  subscribe(g: GameId, m: Market, fn: Listener) {
    const k = key(g, m);
    if (!listeners.has(k)) listeners.set(k, new Set());
    listeners.get(k)!.add(fn);
    return () => listeners.get(k)?.delete(fn);
  },
  publish(result: GameResult) {
    listeners.get(key(result.gameId, result.market))?.forEach((fn) => {
      try { fn(result); } catch (e) { console.error("[resultBus]", e); }
    });
  },
};
