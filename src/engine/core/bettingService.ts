/**
 * Betting Service — thin wrapper around the existing place-bet edge function.
 * Does NOT touch wallet or compute balances; backend remains source of truth.
 */
import { placeBetOptimized } from "@/lib/betService";
import type { BetInput, BetReceipt, GameId, Market } from "./types";

const GAME_TYPE: Record<GameId, string> = {
  wingo: "winGo",
  k3: "k3",
  trx: "trxWin",
  fived: "fiveD",
};

const GAME_MODE: Record<Market, string> = {
  60: "1min",
  180: "3min",
  300: "5min",
  600: "10min",
};

export const bettingService = {
  async place(input: BetInput): Promise<BetReceipt> {
    const potentialWin = Math.floor(input.betAmount * input.multiplier * input.odds);
    return placeBetOptimized({
      gameType: GAME_TYPE[input.gameId],
      gameMode: GAME_MODE[input.market],
      tradeId: input.tradeId,
      betType: input.betType,
      betValue: input.betValue,
      betAmount: input.betAmount,
      multiplier: input.multiplier,
      potentialWin,
    });
  },
};
