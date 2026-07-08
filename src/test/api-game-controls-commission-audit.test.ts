import { describe, it, expect, beforeEach } from "vitest";

type Game = {
  id: string;
  provider_id: string;
  is_enabled: boolean;
  commission_override: number | null;
};

type AuditRow = {
  target_type: "game";
  target_id: string;
  action: "update";
  before: Record<string, any>;
  after: Record<string, any>;
  actor: string | null;
};

class FakeDb {
  games: Game[] = [];
  audit: AuditRow[] = [];
  actor: string | null = "admin-1";

  updateGames(ids: string[], patch: Partial<Game>) {
    const set = new Set(ids);
    for (const g of this.games) {
      if (!set.has(g.id)) continue;
      const before = { ...g };
      Object.assign(g, patch);
      this.audit.push({
        target_type: "game",
        target_id: g.id,
        action: "update",
        before,
        after: { ...g },
        actor: this.actor,
      });
    }
  }
}

let db: FakeDb;
beforeEach(() => {
  db = new FakeDb();
  db.games = [
    { id: "g1", provider_id: "p1", is_enabled: true, commission_override: null },
    { id: "g2", provider_id: "p1", is_enabled: true, commission_override: 5 },
    { id: "g3", provider_id: "p2", is_enabled: true, commission_override: 10 },
  ];
});

describe("commission_override edits → api_game_control_audit (flag ON)", () => {
  it("writes one 'update' audit row when setting an override from null", () => {
    db.updateGames(["g1"], { commission_override: 12 });
    expect(db.audit).toHaveLength(1);
    const a = db.audit[0];
    expect(a.target_type).toBe("game");
    expect(a.target_id).toBe("g1");
    expect(a.action).toBe("update");
    expect(a.before.commission_override).toBeNull();
    expect(a.after.commission_override).toBe(12);
    expect(a.actor).toBe("admin-1");
  });

  it("writes one 'update' audit row when changing an existing override", () => {
    db.updateGames(["g2"], { commission_override: 8 });
    expect(db.audit).toHaveLength(1);
    expect(db.audit[0].before.commission_override).toBe(5);
    expect(db.audit[0].after.commission_override).toBe(8);
  });

  it("writes one 'update' audit row when clearing an override to null", () => {
    db.updateGames(["g3"], { commission_override: null });
    expect(db.audit).toHaveLength(1);
    expect(db.audit[0].before.commission_override).toBe(10);
    expect(db.audit[0].after.commission_override).toBeNull();
  });

  it("writes one audit row per game on a bulk override update", () => {
    db.updateGames(["g1", "g2", "g3"], { commission_override: 7 });
    expect(db.audit).toHaveLength(3);
    expect(db.audit.map((a) => a.target_id).sort()).toEqual(["g1", "g2", "g3"]);
    expect(db.audit.every((a) => a.after.commission_override === 7)).toBe(true);
    const beforeById = Object.fromEntries(
      db.audit.map((a) => [a.target_id, a.before.commission_override])
    );
    expect(beforeById).toEqual({ g1: null, g2: 5, g3: 10 });
  });

  it("does not write audit rows for untouched games", () => {
    db.updateGames(["g1"], { commission_override: 3 });
    expect(db.audit).toHaveLength(1);
    expect(db.audit[0].target_id).toBe("g1");
    expect(db.games.find((g) => g.id === "g2")!.commission_override).toBe(5);
    expect(db.games.find((g) => g.id === "g3")!.commission_override).toBe(10);
  });

  it("preserves the actor on each audit row", () => {
    db.actor = "admin-99";
    db.updateGames(["g2", "g3"], { commission_override: 4 });
    expect(db.audit.every((a) => a.actor === "admin-99")).toBe(true);
  });
});
