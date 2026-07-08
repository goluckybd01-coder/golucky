/**
 * useGameEngine — the single hook every engine page mounts.
 * Provides round, countdown, history, stats and a place-bet callback.
 */
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { BetInput, GameModule, GameResult, Market, RoundInfo } from "./types";
import { computeCountdown, computeRound } from "./roundClock";
import { historyService } from "./historyService";
import { computeStats } from "./statsService";
import { resultBus } from "./resultBus";
import { bettingService } from "./bettingService";

export const useGameEngine = (mod: GameModule, market: Market) => {
  const [round, setRound] = useState<RoundInfo>(() => mod.current(market));
  const [now, setNow] = useState<number>(() => Date.now());
  const [history, setHistory] = useState<GameResult[]>(() => historyService.load(mod.id, market));
  const settledRef = useRef<string | null>(null);

  // tick every 250ms
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  // detect round end → generate result, publish, update history
  useEffect(() => {
    if (now < round.endsAt) return;
    if (settledRef.current === round.tradeId) return;
    settledRef.current = round.tradeId;

    const result = mod.generateResult(round);
    setHistory(historyService.append(result));
    resultBus.publish(result);

    const next = mod.current(market, now);
    setRound(next);
  }, [now, round, mod, market]);

  // reset on market change
  useEffect(() => {
    settledRef.current = null;
    setRound(mod.current(market));
    setHistory(historyService.load(mod.id, market));
  }, [mod, market]);

  const countdown = useMemo(() => computeCountdown(round, now), [round, now]);
  const stats = useMemo(() => computeStats(history), [history]);

  const placeBet = useCallback(
    (partial: Omit<BetInput, "gameId" | "market" | "tradeId">) =>
      bettingService.place({
        ...partial,
        gameId: mod.id,
        market,
        tradeId: round.tradeId,
      }),
    [mod.id, market, round.tradeId]
  );

  return { round, countdown, history, stats, placeBet };
};
