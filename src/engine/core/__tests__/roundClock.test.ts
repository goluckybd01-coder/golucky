import { describe, it, expect } from "vitest";
import { computeRound, computeCountdown } from "../roundClock";
import { MARKETS, type GameId, type Market } from "../types";

const GAMES: GameId[] = ["wingo", "k3", "trx", "fived"];
const PREFIX: Record<GameId, string> = { wingo: "WG", k3: "K3", trx: "TX", fived: "5D" };
const CODE: Record<Market, string> = { 60: "B", 180: "C", 300: "D", 600: "E" };

describe("round engine ↔ UI parity", () => {
  it("exposes exactly the four markets 60/180/300/600", () => {
    expect(MARKETS).toEqual([60, 180, 300, 600]);
  });

  for (const game of GAMES) {
    for (const market of MARKETS) {
      it(`${game} @ ${market}s has matching duration + period id`, () => {
        const now = Date.UTC(2026, 5, 27, 12, 34, 56);
        const r = computeRound(game, market, now);

        // duration
        expect(r.endsAt - r.startsAt).toBe(market * 1000);
        expect(r.market).toBe(market);
        expect(r.gameId).toBe(game);

        // boundary alignment
        expect(r.startsAt % (market * 1000)).toBe(0);
        expect(now).toBeGreaterThanOrEqual(r.startsAt);
        expect(now).toBeLessThan(r.endsAt);

        // period id format: PREFIX + CODE + YYYYMMDD + 5-digit seq
        const re = new RegExp(`^${PREFIX[game]}${CODE[market]}\\d{8}\\d{5}$`);
        expect(r.tradeId).toMatch(re);

        // total countdown equals market duration
        const c = computeCountdown(r, r.startsAt);
        expect(c.totalMs).toBe(market * 1000);
        expect(c.remainingMs).toBe(market * 1000);
      });
    }
  }

  it("produces identical tradeId for all games sharing a market boundary", () => {
    const now = Date.UTC(2026, 5, 27, 0, 0, 0);
    for (const market of MARKETS) {
      const ids = GAMES.map((g) => computeRound(g, market, now).tradeId);
      const tails = ids.map((id) => id.slice(2)); // strip game prefix
      expect(new Set(tails).size).toBe(1);
    }
  });

  it("locks the last 5s of every market", () => {
    for (const market of MARKETS) {
      const r = computeRound("wingo", market, Date.UTC(2026, 0, 1, 0, 0, 0));
      expect(computeCountdown(r, r.endsAt - 6000).locked).toBe(false);
      expect(computeCountdown(r, r.endsAt - 4000).locked).toBe(true);
    }
  });
});
