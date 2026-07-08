import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor, fireEvent } from "@testing-library/react";

const selectCalls: string[] = [];
const seedQueryIds: string[] = [];
let staffRole: "super_admin" | "admin" | null = null;
let userId: string | null = "user-1";
let seedRows: Array<{ server_seed: string | null }> = [];
let seedError: { message: string } | null = null;
let seedResolver:
  | ((rows: Array<{ server_seed: string | null }>) => void)
  | null = null;
let pendingSeedQueries: Array<{
  ids: string[];
  resolve: (rows: Array<{ server_seed: string | null }>) => void;
}> = [];

vi.mock("@/integrations/supabase/client", () => {
  const from = (table: string) => ({
    select: (cols: string) => {
      selectCalls.push(`${table}:${cols}`);
      const builder: any = {
        eq: () => builder,
        in: (_col: string, ids: string[]) => {
          seedQueryIds.push(ids.join(","));
          if (seedResolver === null) {
            return Promise.resolve(
              seedError
                ? { data: null, error: seedError }
                : { data: seedRows, error: null },
            );
          }
          return new Promise((resolve) => {
            pendingSeedQueries.push({
              ids,
              resolve: (rows) => resolve({ data: rows, error: null }),
            });
          });
        },
        maybeSingle: () =>
          Promise.resolve({
            data: staffRole ? { staff_role: staffRole, is_active: true } : null,
            error: null,
          }),
      };
      return builder;
    },
  });
  return {
    supabase: {
      from,
      auth: {
        getUser: () =>
          Promise.resolve({ data: { user: userId ? { id: userId } : null } }),
      },
    },
  };
});

import { AviatorServerSeedField } from "@/components/aviator/AviatorServerSeedField";

const hasServerSeedQuery = () =>
  selectCalls.some((c) => c.startsWith("aviator_rounds:") && c.includes("server_seed"));

beforeEach(() => {
  selectCalls.length = 0;
  seedQueryIds.length = 0;
  userId = "user-1";
  staffRole = null;
  seedRows = [];
  seedError = null;
  seedResolver = null;
  pendingSeedQueries = [];
});

describe("<AviatorServerSeedField /> — non-super_admin safety", () => {
  const assertHidden = async (container: HTMLElement) => {
    await waitFor(() =>
      expect(container.textContent).toMatch(/Hidden — visible to super admins only/i),
    );
    expect(container.textContent).not.toMatch(/Not yet revealed/i);
    expect(container.querySelector("[data-testid='aviator-server-seed-value']")).toBeNull();
    expect(hasServerSeedQuery()).toBe(false);
  };

  it("regular user: shows 'Hidden' fallback, never queries server_seed", async () => {
    staffRole = null;
    const { container } = render(<AviatorServerSeedField roundId="r1" />);
    await assertHidden(container);
  });

  it("admin (non-super): shows 'Hidden' fallback, never queries server_seed", async () => {
    staffRole = "admin";
    const { container } = render(<AviatorServerSeedField roundId="r1" />);
    await assertHidden(container);
  });

  it("unauthenticated: shows 'Hidden' fallback, never queries server_seed", async () => {
    userId = null;
    const { container } = render(<AviatorServerSeedField roundId="r1" />);
    await assertHidden(container);
  });

  it("super_admin: renders seed value and issues the server_seed query", async () => {
    staffRole = "super_admin";
    seedRows = [{ server_seed: "SEED_ABC_123" }];
    const { container } = render(<AviatorServerSeedField roundId="r1" />);
    await waitFor(() =>
      expect(container.textContent).toMatch(/SEED_ABC_123/),
    );
    expect(container.textContent).not.toMatch(/Hidden — visible to super admins only/i);
    const seedQueries = selectCalls.filter(
      (c) => c.startsWith("aviator_rounds:") && c.includes("server_seed"),
    );
    expect(seedQueries).toHaveLength(1);
  });
});
