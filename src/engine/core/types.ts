/**
 * GoLucky Game Engine — Core Types
 * Shared contracts across WinGo, K3, TRX, 5D and future native games.
 */

export type GameId = "wingo" | "k3" | "trx" | "fived";

/** Supported markets in seconds */
export type Market = 60 | 180 | 300 | 600;

export const MARKETS: Market[] = [60, 180, 300, 600];

export const marketLabel = (m: Market): string =>
  m === 60 ? "1 Min" : m === 180 ? "3 Min" : m === 300 ? "5 Min" : "10 Min";

export const marketShort = (m: Market): string =>
  m === 60 ? "1m" : m === 180 ? "3m" : m === 300 ? "5m" : "10m";

export interface RoundInfo {
  gameId: GameId;
  market: Market;
  /** Trade/Period identifier */
  tradeId: string;
  /** Round start epoch ms */
  startsAt: number;
  /** Round end epoch ms */
  endsAt: number;
}

export interface CountdownState {
  remainingMs: number;
  /** True during last 5 seconds — betting locked */
  locked: boolean;
  phase: "open" | "locked";
  totalMs: number;
}

export interface GameResult {
  gameId: GameId;
  market: Market;
  tradeId: string;
  endedAt: number;
  /** Raw number/dice/digits payload */
  payload: Record<string, unknown>;
  /** Headline number used for big/small/odd/even stats */
  headline: number;
}

export interface BetInput {
  gameId: GameId;
  market: Market;
  tradeId: string;
  betType: string;
  betValue: string;
  betAmount: number;
  multiplier: number;
  odds: number;
}

export interface BetReceipt {
  success: boolean;
  betId?: string;
  newBalance?: number;
  error?: string;
}

export interface Stats {
  total: number;
  big: number;
    small: number;
  odd: number;
  even: number;
  /** Hot/cold counters keyed by headline value */
  distribution: Record<string, number>;
  /** Last 30 headlines, newest first */
  recent: number[];
}

/** Module contract — every game implements this */
export interface GameModule {
  id: GameId;
  name: string;
  supportedMarkets: Market[];
  /** Default odds for big/small or main bet */
  defaultOdds: number;

  current(market: Market, now?: number): RoundInfo;
  generateResult(round: RoundInfo): GameResult;
  formatTradeId(round: RoundInfo): string;
}
