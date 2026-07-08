/**
 * Deterministic round clock. Every market's round starts on epoch boundaries
 * so all clients converge on the same tradeId without server sync.
 */
import type { GameId, Market, RoundInfo } from "./types";

const MARKET_CODE: Record<Market, string> = {
  60: "B",
  180: "C",
  300: "D",
  600: "E",
};

const GAME_PREFIX: Record<GameId, string> = {
  wingo: "WG",
  k3: "K3",
  trx: "TX",
  fived: "5D",
};

const pad = (n: number, w: number) => String(n).padStart(w, "0");

export const computeRound = (
  gameId: GameId,
  market: Market,
  now: number = Date.now()
): RoundInfo => {
  const durationMs = market * 1000;
  const startsAt = Math.floor(now / durationMs) * durationMs;
  const endsAt = startsAt + durationMs;

  const d = new Date(startsAt);
  const y = d.getUTCFullYear();
  const mo = pad(d.getUTCMonth() + 1, 2);
  const da = pad(d.getUTCDate(), 2);
  const seq = Math.floor((startsAt % 86_400_000) / durationMs);
  const tradeId = `${GAME_PREFIX[gameId]}${MARKET_CODE[market]}${y}${mo}${da}${pad(seq, 5)}`;

  return { gameId, market, tradeId, startsAt, endsAt };
};

export const computeCountdown = (round: RoundInfo, now: number = Date.now()) => {
  const remainingMs = Math.max(0, round.endsAt - now);
  const totalMs = round.endsAt - round.startsAt;
  const locked = remainingMs <= 5000;
  return { remainingMs, totalMs, locked, phase: locked ? "locked" as const : "open" as const };
};
