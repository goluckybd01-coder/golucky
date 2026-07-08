import type { GameModule, GameResult, RoundInfo } from "../core/types";
import { computeRound } from "../core/roundClock";

export const wingoColors = (n: number): string[] => {
  if (n === 0) return ["violet", "red"];
  if (n === 5) return ["violet", "green"];
  if ([1, 3, 7, 9].includes(n)) return ["green"];
  return ["red"];
};

export const WinGoModule: GameModule = {
  id: "wingo",
  name: "WinGo",
  supportedMarkets: [60, 180, 300, 600],
  defaultOdds: 2,
  current: (market, now) => computeRound("wingo", market, now),
  formatTradeId: (r) => r.tradeId,
  generateResult: (round: RoundInfo): GameResult => {
    const n = Math.floor(Math.random() * 10);
    return {
      gameId: "wingo",
      market: round.market,
      tradeId: round.tradeId,
      endedAt: round.endsAt,
      headline: n,
      payload: { number: n, colors: wingoColors(n), bigSmall: n >= 5 ? "Big" : "Small", oddEven: n % 2 === 0 ? "Even" : "Odd" },
    };
  },
};
