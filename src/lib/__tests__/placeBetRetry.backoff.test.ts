import { describe, it, expect, vi, beforeEach } from "vitest";
import { computeBackoffDelay, invokePlaceBetWithRetry } from "../placeBetRetry";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

import { supabase } from "@/integrations/supabase/client";
const invoke = supabase.functions.invoke as unknown as ReturnType<typeof vi.fn>;

describe("computeBackoffDelay", () => {
  it("doubles per attempt with deterministic jitter", () => {
    const rand = () => 0.5; // jitter = floor(0.5 * 100) = 50
    expect(computeBackoffDelay(1, 250, 4000, 100, rand)).toBe(300);   // 250 + 50
    expect(computeBackoffDelay(2, 250, 4000, 100, rand)).toBe(550);   // 500 + 50
    expect(computeBackoffDelay(3, 250, 4000, 100, rand)).toBe(1050);  // 1000 + 50
    expect(computeBackoffDelay(4, 250, 4000, 100, rand)).toBe(2050);  // 2000 + 50
  });

  it("caps at maxDelayMs", () => {
    expect(computeBackoffDelay(10, 250, 4000, 100, () => 0)).toBe(4000);
  });

  it("adds zero jitter when random() returns 0", () => {
    expect(computeBackoffDelay(1, 200, 4000, 100, () => 0)).toBe(200);
  });
});

describe("invokePlaceBetWithRetry timing", () => {
  beforeEach(() => {
    invoke.mockReset();
  });

  it("waits with exponential backoff between retries", async () => {
    invoke
      .mockResolvedValueOnce({ data: null, error: { message: "network failure" } })
      .mockResolvedValueOnce({ data: null, error: { name: "AbortError" } })
      .mockResolvedValueOnce({ data: { success: true }, error: null });

    const sleeps: number[] = [];
    const sleep = vi.fn(async (ms: number) => { sleeps.push(ms); });
    const res = await invokePlaceBetWithRetry(
      { foo: "bar" },
      { retries: 2, baseDelayMs: 100, jitterMs: 50, random: () => 0.4, sleep },
    );

    expect(res.data).toEqual({ success: true });
    expect(invoke).toHaveBeenCalledTimes(3);
    // attempt 1 delay = 100 + floor(0.4*50)=20 → 120
    // attempt 2 delay = 200 + 20 → 220
    expect(sleeps).toEqual([120, 220]);
  });

  it("does not sleep when the first call succeeds", async () => {
    invoke.mockResolvedValueOnce({ data: { success: true }, error: null });
    const sleep = vi.fn(async () => {});
    await invokePlaceBetWithRetry({}, { sleep });
    expect(sleep).not.toHaveBeenCalled();
  });

  it("does not sleep on non-transient errors", async () => {
    invoke.mockResolvedValueOnce({ data: null, error: { message: "insufficient balance" } });
    const sleep = vi.fn(async () => {});
    const res = await invokePlaceBetWithRetry({}, { sleep });
    expect(res.error.message).toBe("insufficient balance");
    expect(sleep).not.toHaveBeenCalled();
    expect(invoke).toHaveBeenCalledTimes(1);
  });
});
