import type { GameModule, GameResult, RoundInfo } from "../core/types";
import { computeRound } from "../core/roundClock";
import { wingoColors } from "../wingo";

const fakeBlockHash = (tradeId: string) =>
  Array.from({ length: 16 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("") + tradeId.slice(-4);

export const TrxModule: GameModule = {
  id: "trx",
  name: "TRX Win",
  supportedMarkets: [60, 180, 300, 600],
  defaultOdds: 2,
  current: (market, now) => computeRound("trx", market, now),
  formatTradeId: (r) => r.tradeId,
  generateResult: (round: RoundInfo): GameResult => {
    const hash = fakeBlockHash(round.tradeId);
    const lastDigit = parseInt(hash.slice(-1), 16) % 10;
    return {
      gameId: "trx",
      market: round.market,
      tradeId: round.tradeId,
      endedAt: round.endsAt,
      headline: lastDigit,
      payload: { number: lastDigit, colors: wingoColors(lastDigit), hash, bigSmall: lastDigit >= 5 ? "Big" : "Small", oddEven: lastDigit % 2 === 0 ? "Even" : "Odd" },
    };
  },
};
