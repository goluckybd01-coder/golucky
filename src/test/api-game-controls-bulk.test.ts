import { describe, it, expect } from "vitest";
import {
  providerVisible,
  gameVisible,
  type ProviderLike,
  type GameLike,
} from "@/hooks/useApiGameControls";

/**
 * Integration-style tests for BULK enable/disable behavior with the
 * api_game_controls_enabled flag ON. Simulates the admin bulk action
 * (mutating is_enabled on many rows) then re-runs the live listing
 * pipeline to verify visibility.
 */

type Provider = ProviderLike & { id: string };
type Game = GameLike & { id: string; provider_id: string };

function makeProviders(): Provider[] {
  return [
    { id: "p1", is_enabled: true, maintenance_mode: false },
    { id: "p2", is_enabled: true, maintenance_mode: false },
    { id: "p3", is_enabled: true, maintenance_mode: false },
  ];
}

function makeGames(): Game[] {
  return [
    { id: "g1", provider_id: "p1", is_enabled: true },
    { id: "g2", provider_id: "p1", is_enabled: true },
    { id: "g3", provider_id: "p2", is_enabled: true },
    { id: "g4", provider_id: "p2", is_enabled: true },
    { id: "g5", provider_id: "p3", is_enabled: true },
  ];
}

/** Admin bulk mutation helper. */
function bulkSetEnabled<T extends { id: string; is_enabled?: boolean | null }>(
  rows: T[],
  ids: string[],
  enabled: boolean
): T[] {
  const set = new Set(ids);
  return rows.map((r) => (set.has(r.id) ? { ...r, is_enabled: enabled } : r));
}

function listProviders(rows: Provider[], flag: boolean) {
  return rows.filter((p) => p.is_enabled).filter((p) => providerVisible(p, flag));
}

function listGames(
  providerRows: Provider[],
  gameRows: Game[],
  flag: boolean,
  ctx = { isVip: true, isAgent: true }
) {
  const visible = new Set(listProviders(providerRows, flag).map((p) => p.id));
  return gameRows
    .filter((g) => g.is_enabled)
    .filter((g) => visible.has(g.provider_id))
    .filter((g) => gameVisible(g, flag, ctx));
}

describe("Bulk provider enable/disable (flag ON)", () => {
  it("bulk-disable hides all selected providers and their games", () => {
    const providers = bulkSetEnabled(makeProviders(), ["p1", "p2"], false);
    const games = makeGames();
    expect(listProviders(providers, true).map((p) => p.id)).toEqual(["p3"]);
    expect(listGames(providers, games, true).map((g) => g.id)).toEqual(["g5"]);
  });

  it("bulk-enable restores previously disabled providers and their games", () => {
    let providers = bulkSetEnabled(makeProviders(), ["p1", "p2", "p3"], false);
    expect(listProviders(providers, true)).toHaveLength(0);

    providers = bulkSetEnabled(providers, ["p1", "p2"], true);
    expect(listProviders(providers, true).map((p) => p.id).sort()).toEqual(["p1", "p2"]);
    expect(listGames(providers, makeGames(), true).map((g) => g.id).sort()).toEqual([
      "g1",
      "g2",
      "g3",
      "g4",
    ]);
  });

  it("bulk toggling leaves untouched providers unchanged", () => {
    const providers = bulkSetEnabled(makeProviders(), ["p1"], false);
    expect(listProviders(providers, true).map((p) => p.id).sort()).toEqual(["p2", "p3"]);
  });
});

describe("Bulk game enable/disable (flag ON)", () => {
  it("bulk-disable hides only the selected games", () => {
    const games = bulkSetEnabled(makeGames(), ["g1", "g3", "g5"], false);
    expect(listGames(makeProviders(), games, true).map((g) => g.id).sort()).toEqual([
      "g2",
      "g4",
    ]);
  });

  it("bulk-enable restores previously disabled games", () => {
    let games = bulkSetEnabled(makeGames(), ["g1", "g2", "g3", "g4", "g5"], false);
    expect(listGames(makeProviders(), games, true)).toHaveLength(0);

    games = bulkSetEnabled(games, ["g2", "g4"], true);
    expect(listGames(makeProviders(), games, true).map((g) => g.id).sort()).toEqual([
      "g2",
      "g4",
    ]);
  });

  it("bulk game changes do not affect other providers' games", () => {
    const games = bulkSetEnabled(makeGames(), ["g1", "g2"], false);
    const visibleForP2 = listGames(makeProviders(), games, true)
      .filter((g) => g.provider_id === "p2")
      .map((g) => g.id)
      .sort();
    expect(visibleForP2).toEqual(["g3", "g4"]);
  });
});

describe("Bulk operations with flag OFF — parity", () => {
  it("still honors is_enabled from bulk mutations", () => {
    const providers = bulkSetEnabled(makeProviders(), ["p1"], false);
    const games = bulkSetEnabled(makeGames(), ["g3"], false);
    const ids = listGames(providers, games, false).map((g) => g.id).sort();
    // p1 disabled hides g1,g2; g3 disabled hides itself
    expect(ids).toEqual(["g4", "g5"]);
  });
});
