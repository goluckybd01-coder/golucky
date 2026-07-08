import { describe, it, expect } from "vitest";
import {
  providerVisible,
  gameVisible,
  type ProviderLike,
  type GameLike,
} from "@/hooks/useApiGameControls";

type Provider = ProviderLike & { id: string };
type Game = GameLike & { id: string; provider_id: string };

const providers: Provider[] = [
  { id: "p_on", is_enabled: true, maintenance_mode: false },
  { id: "p_off", is_enabled: false, maintenance_mode: false },
  { id: "p_maint", is_enabled: true, maintenance_mode: true },
];

const games: Game[] = [
  { id: "g_on", provider_id: "p_on", is_enabled: true, maintenance_mode: false },
  { id: "g_off", provider_id: "p_on", is_enabled: false, maintenance_mode: false },
  { id: "g_maint", provider_id: "p_on", is_enabled: true, maintenance_mode: true },
  { id: "g_off_offprov", provider_id: "p_off", is_enabled: true, maintenance_mode: false },
  { id: "g_vip", provider_id: "p_on", is_enabled: true, vip_only: true },
  { id: "g_agent", provider_id: "p_on", is_enabled: true, agent_only: true },
];

function listProviders(flag: boolean) {
  return providers.filter((p) => p.is_enabled).filter((p) => providerVisible(p, flag));
}

function listGames(
  flag: boolean,
  ctx: { isVip: boolean; isAgent: boolean }
) {
  const visibleProviderIds = new Set(listProviders(flag).map((p) => p.id));
  return games
    .filter((g) => g.is_enabled)
    .filter((g) => visibleProviderIds.has(g.provider_id))
    .filter((g) => gameVisible(g, flag, ctx));
}

describe("api_game_controls_enabled ON — provider enable/disable", () => {
  it("excludes disabled providers", () => {
    const ids = listProviders(true).map((p) => p.id);
    expect(ids).not.toContain("p_off");
  });

  it("excludes providers in maintenance_mode", () => {
    const ids = listProviders(true).map((p) => p.id);
    expect(ids).not.toContain("p_maint");
  });

  it("keeps enabled, non-maintenance providers", () => {
    const ids = listProviders(true).map((p) => p.id);
    expect(ids).toEqual(["p_on"]);
  });

  it("hides all games belonging to a disabled provider", () => {
    const ids = listGames(true, { isVip: true, isAgent: true }).map((g) => g.id);
    expect(ids).not.toContain("g_off_offprov");
  });
});

describe("api_game_controls_enabled ON — game enable/disable", () => {
  it("excludes disabled games", () => {
    const ids = listGames(true, { isVip: true, isAgent: true }).map((g) => g.id);
    expect(ids).not.toContain("g_off");
  });

  it("excludes games in maintenance_mode", () => {
    const ids = listGames(true, { isVip: true, isAgent: true }).map((g) => g.id);
    expect(ids).not.toContain("g_maint");
  });

  it("hides vip_only games from non-VIP users", () => {
    const ids = listGames(true, { isVip: false, isAgent: false }).map((g) => g.id);
    expect(ids).not.toContain("g_vip");
  });

  it("shows vip_only games to VIP users", () => {
    const ids = listGames(true, { isVip: true, isAgent: false }).map((g) => g.id);
    expect(ids).toContain("g_vip");
  });

  it("hides agent_only games from non-agents", () => {
    const ids = listGames(true, { isVip: false, isAgent: false }).map((g) => g.id);
    expect(ids).not.toContain("g_agent");
  });

  it("shows agent_only games to agents", () => {
    const ids = listGames(true, { isVip: false, isAgent: true }).map((g) => g.id);
    expect(ids).toContain("g_agent");
  });
});

describe("api_game_controls_enabled OFF — parity check", () => {
  it("still respects server-side is_enabled but does not apply maintenance/vip/agent rules", () => {
    const ids = listGames(false, { isVip: false, isAgent: false }).map((g) => g.id);
    expect(ids).not.toContain("g_off");
    expect(ids).not.toContain("g_off_offprov");
    expect(ids).toContain("g_maint");
    expect(ids).toContain("g_vip");
    expect(ids).toContain("g_agent");
  });
});
