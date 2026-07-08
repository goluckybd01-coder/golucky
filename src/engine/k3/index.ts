import type { GameModule, GameResult, RoundInfo } from "../core/types";
import { computeRound } from "../core/roundClock";

const d6 = () => 1 + Math.floor(Math.random() * 6);

export const K3Module: GameModule = {
  id: "k3",
  name: "K3 Lotre",
  supportedMarkets: [60, 180, 300, 600],
  defaultOdds: 2,
  current: (market, now) => computeRound("k3", market, now),
  formatTradeId: (r) => r.tradeId,
  generateResult: (round: RoundInfo): GameResult => {
    const dice: [number, number, number] = [d6(), d6(), d6()];
    const sum = dice[0] + dice[1] + dice[2];
    return {
      gameId: "k3",
      market: round.market,
      tradeId: round.tradeId,
      endedAt: round.endsAt,
      headline: sum,
      payload: { dice, sum, bigSmall: sum >= 11 ? "Big" : "Small", oddEven: sum % 2 === 0 ? "Even" : "Odd" },
    };
  },
};
