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
  actor: string | null = null;

  setActor(actor: string | null) {
    this.actor = actor;
  }

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
    { id: "g4", provider_id: "p2", is_enabled: true, commission_override: null },
  ];
});

describe("commission_override audit — actor preservation (flag ON)", () => {
  it("stamps the acting admin on a single-row update", () => {
    db.setActor("admin-alpha");
    db.updateGames(["g1"], { commission_override: 7 });
    expect(db.audit).toHaveLength(1);
    expect(db.audit[0].actor).toBe("admin-alpha");
  });

  it("stamps the same actor on every row of a bulk update", () => {
    db.setActor("admin-bulk");
    db.updateGames(["g1", "g2", "g3", "g4"], { commission_override: 9 });
    expect(db.audit).toHaveLength(4);
    expect(db.audit.every((a) => a.actor === "admin-bulk")).toBe(true);
  });

  it("stamps distinct actors across separate sessions", () => {
    db.setActor("admin-one");
    db.updateGames(["g1"], { commission_override: 3 });
    db.setActor("admin-two");
    db.updateGames(["g2"], { commission_override: 4 });
    const byId = Object.fromEntries(db.audit.map((a) => [a.target_id, a.actor]));
    expect(byId).toEqual({ g1: "admin-one", g2: "admin-two" });
  });

  it("records a null actor when no admin context is bound", () => {
    db.setActor(null);
    db.updateGames(["g3"], { commission_override: 6 });
    expect(db.audit[0].actor).toBeNull();
  });
});

describe("commission_override audit — before/after null transitions (flag ON)", () => {
  it("null → number: before is null, after is the new number", () => {
    db.setActor("admin-x");
    db.updateGames(["g1"], { commission_override: 15 });
    const a = db.audit[0];
    expect(a.before.commission_override).toBeNull();
    expect(a.after.commission_override).toBe(15);
  });

  it("number → null: before is the old number, after is null", () => {
    db.setActor("admin-x");
    db.updateGames(["g2"], { commission_override: null });
    const a = db.audit[0];
    expect(a.before.commission_override).toBe(5);
    expect(a.after.commission_override).toBeNull();
  });

  it("number → number: exact before/after values are preserved", () => {
    db.setActor("admin-x");
    db.updateGames(["g3"], { commission_override: 22 });
    const a = db.audit[0];
    expect(a.before.commission_override).toBe(10);
    expect(a.after.commission_override).toBe(22);
  });

  it("null → null (no-op patch): audit still snapshots both sides as null", () => {
    db.setActor("admin-x");
    db.updateGames(["g4"], { commission_override: null });
    const a = db.audit[0];
    expect(a.before.commission_override).toBeNull();
    expect(a.after.commission_override).toBeNull();
  });

  it("mixed bulk update captures per-row before values accurately", () => {
    db.setActor("admin-bulk");
    db.updateGames(["g1", "g2", "g3", "g4"], { commission_override: 12 });
    const beforeById = Object.fromEntries(
      db.audit.map((a) => [a.target_id, a.before.commission_override])
    );
    const afterById = Object.fromEntries(
      db.audit.map((a) => [a.target_id, a.after.commission_override])
    );
    expect(beforeById).toEqual({ g1: null, g2: 5, g3: 10, g4: null });
    expect(afterById).toEqual({ g1: 12, g2: 12, g3: 12, g4: 12 });
  });

  it("preserves untouched sibling fields in before/after snapshots", () => {
    db.setActor("admin-x");
    db.updateGames(["g2"], { commission_override: 8 });
    const a = db.audit[0];
    expect(a.before.provider_id).toBe("p1");
    expect(a.after.provider_id).toBe("p1");
    expect(a.before.is_enabled).toBe(true);
    expect(a.after.is_enabled).toBe(true);
  });
});
