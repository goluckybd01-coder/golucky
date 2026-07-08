import { describe, it, expect } from "vitest";
import { providerVisible, gameVisible } from "@/hooks/useApiGameControls";

describe("api_game_controls_enabled feature flag", () => {
  it("flag OFF: everything passes (live behavior unchanged)", () => {
    expect(providerVisible({ maintenance_mode: true }, false)).toBe(true);
    expect(
      gameVisible({ maintenance_mode: true, vip_only: true, agent_only: true }, false, {
        isVip: false,
        isAgent: false,
      })
    ).toBe(true);
  });

  it("flag ON: hides providers in maintenance", () => {
    expect(providerVisible({ maintenance_mode: true }, true)).toBe(false);
    expect(providerVisible({ maintenance_mode: false }, true)).toBe(true);
  });

  it("flag ON: hides games in maintenance", () => {
    expect(
      gameVisible({ maintenance_mode: true }, true, { isVip: true, isAgent: true })
    ).toBe(false);
  });

  it("flag ON: hides vip_only from non-VIP", () => {
    expect(gameVisible({ vip_only: true }, true, { isVip: false, isAgent: false })).toBe(false);
    expect(gameVisible({ vip_only: true }, true, { isVip: true, isAgent: false })).toBe(true);
  });

  it("flag ON: hides agent_only from non-agent", () => {
    expect(gameVisible({ agent_only: true }, true, { isVip: false, isAgent: false })).toBe(false);
    expect(gameVisible({ agent_only: true }, true, { isVip: false, isAgent: true })).toBe(true);
  });

  it("flag ON: normal game visible to normal user", () => {
    expect(gameVisible({}, true, { isVip: false, isAgent: false })).toBe(true);
  });
});
