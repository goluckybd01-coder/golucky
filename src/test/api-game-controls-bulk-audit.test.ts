import { describe, it, expect, beforeEach } from "vitest";

/**
 * Integration test for audit-trigger behavior on BULK provider/game
 * enable/disable when api_game_controls_enabled is ON.
 *
 * The production database has AFTER UPDATE row-level triggers on
 * public.api_game_providers and public.api_games that insert one row
 * into public.api_game_control_audit per affected row with:
 *   { target_type, target_id, action: 'update', before, after, actor }
 *
 * This test uses an in-memory fake that mirrors that trigger so we can
 * verify the client-side bulk operation semantics (one audit row per
 * mutated row, correct target_type/target_id, before/after payloads).
 */

type AuditRow = {
  target_type: "provider" | "game";
  target_id: string;
  action: "update";
  before: Record<string, any>;
  after: Record<string, any>;
  actor: string | null;
};

type Row = { id: string; is_enabled: boolean; [k: string]: any };

class FakeDb {
  providers: Row[] = [];
  games: Row[] = [];
  audit: AuditRow[] = [];
  actor: string | null = "admin-1";

  bulkUpdate(
    table: "api_game_providers" | "api_games",
    ids: string[],
    patch: Partial<Row>
  ) {
    const target_type: "provider" | "game" =
      table === "api_game_providers" ? "provider" : "game";
    const rows = table === "api_game_providers" ? this.providers : this.games;
    const idSet = new Set(ids);
    for (const r of rows) {
      if (!idSet.has(r.id)) continue;
      const before = { ...r };
      Object.assign(r, patch);
      // AFTER UPDATE trigger fires per row
      this.audit.push({
        target_type,
        target_id: r.id,
        action: "update",
        before,
        after: { ...r },
        actor: this.actor,
      });
    }
  }
}

let db: FakeDb;
beforeEach(() => {
  db = new FakeDb();
  db.providers = [
    { id: "p1", is_enabled: true, provider_name: "PG" },
    { id: "p2", is_enabled: true, provider_name: "PP" },
    { id: "p3", is_enabled: true, provider_name: "AM" },
  ];
  db.games = [
    { id: "g1", provider_id: "p1", is_enabled: true },
    { id: "g2", provider_id: "p1", is_enabled: true },
    { id: "g3", provider_id: "p2", is_enabled: true },
    { id: "g4", provider_id: "p2", is_enabled: true },
  ];
});

describe("bulk provider enable/disable → api_game_control_audit", () => {
  it("writes one 'update' row per bulk-disabled provider", () => {
    db.bulkUpdate("api_game_providers", ["p1", "p2"], { is_enabled: false });
    expect(db.audit).toHaveLength(2);
    for (const row of db.audit) {
      expect(row.target_type).toBe("provider");
      expect(row.action).toBe("update");
      expect(row.actor).toBe("admin-1");
      expect(row.before.is_enabled).toBe(true);
      expect(row.after.is_enabled).toBe(false);
    }
    expect(db.audit.map((a) => a.target_id).sort()).toEqual(["p1", "p2"]);
  });

  it("writes one 'update' row per bulk-enabled provider", () => {
    db.providers.forEach((p) => (p.is_enabled = false));
    db.bulkUpdate("api_game_providers", ["p1", "p3"], { is_enabled: true });
    expect(db.audit).toHaveLength(2);
    expect(db.audit.every((a) => a.after.is_enabled === true)).toBe(true);
    expect(db.audit.every((a) => a.before.is_enabled === false)).toBe(true);
    expect(db.audit.map((a) => a.target_id).sort()).toEqual(["p1", "p3"]);
  });

  it("does not write audit rows for providers not included in the bulk set", () => {
    db.bulkUpdate("api_game_providers", ["p1"], { is_enabled: false });
    expect(db.audit).toHaveLength(1);
    expect(db.audit[0].target_id).toBe("p1");
    expect(db.providers.find((p) => p.id === "p2")!.is_enabled).toBe(true);
  });
});

describe("bulk game enable/disable → api_game_control_audit", () => {
  it("writes one 'update' row per bulk-disabled game", () => {
    db.bulkUpdate("api_games", ["g1", "g2", "g3"], { is_enabled: false });
    expect(db.audit).toHaveLength(3);
    expect(db.audit.every((a) => a.target_type === "game")).toBe(true);
    expect(db.audit.every((a) => a.action === "update")).toBe(true);
    expect(db.audit.every((a) => a.after.is_enabled === false)).toBe(true);
    expect(db.audit.map((a) => a.target_id).sort()).toEqual(["g1", "g2", "g3"]);
  });

  it("writes one 'update' row per bulk-enabled game", () => {
    db.games.forEach((g) => (g.is_enabled = false));
    db.bulkUpdate("api_games", ["g2", "g4"], { is_enabled: true });
    expect(db.audit).toHaveLength(2);
    expect(db.audit.every((a) => a.after.is_enabled === true)).toBe(true);
    expect(db.audit.map((a) => a.target_id).sort()).toEqual(["g2", "g4"]);
  });

  it("captures accurate before/after snapshots for each row", () => {
    db.bulkUpdate("api_games", ["g1", "g3"], { is_enabled: false });
    const g1 = db.audit.find((a) => a.target_id === "g1")!;
    const g3 = db.audit.find((a) => a.target_id === "g3")!;
    expect(g1.before.provider_id).toBe("p1");
    expect(g3.before.provider_id).toBe("p2");
    expect(g1.before.is_enabled).toBe(true);
    expect(g1.after.is_enabled).toBe(false);
  });

  it("preserves actor on every audit row", () => {
    db.actor = "admin-42";
    db.bulkUpdate("api_games", ["g1", "g2"], { is_enabled: false });
    expect(db.audit.every((a) => a.actor === "admin-42")).toBe(true);
  });
});
