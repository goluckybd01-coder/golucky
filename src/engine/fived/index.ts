import type { GameModule, GameResult, RoundInfo } from "../core/types";
import { computeRound } from "../core/roundClock";

const digit = () => Math.floor(Math.random() * 10);

export const FiveDModule: GameModule = {
  id: "fived",
  name: "5D Lotre",
  supportedMarkets: [60, 180, 300, 600],
  defaultOdds: 2,
  current: (market, now) => computeRound("fived", market, now),
  formatTradeId: (r) => r.tradeId,
  generateResult: (round: RoundInfo): GameResult => {
    const digits: [number, number, number, number, number] = [digit(), digit(), digit(), digit(), digit()];
    const sum = digits.reduce((a, b) => a + b, 0);
    return {
      gameId: "fived",
      market: round.market,
      tradeId: round.tradeId,
      endedAt: round.endsAt,
      headline: sum,
      payload: { digits, sum, bigSmall: sum >= 23 ? "Big" : "Small", oddEven: sum % 2 === 0 ? "Even" : "Odd" },
    };
  },
};
