import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

// --- Mocks ----------------------------------------------------------------
const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: { success: (...a: any[]) => toastSuccess(...a), error: (...a: any[]) => toastError(...a) },
}));

vi.mock("@/lib/realtimeActivity", () => ({
  getLastRealtimeActivity: () => null,
  subscribeRealtimeActivity: () => () => {},
}));

// Capture channel subscribe callbacks so tests can drive status changes.
const subscribers: Array<(s: string) => void> = [];
const removeChannel = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    channel: () => ({
      subscribe: (cb: (s: string) => void) => {
        subscribers.push(cb);
        return { unsubscribe: () => {} };
      },
    }),
    removeChannel: (...a: any[]) => removeChannel(...a),
    realtime: { disconnect: vi.fn(), connect: vi.fn() },
  },
}));

import RealtimeStatusBanner from "./RealtimeStatusBanner";

const flushMicro = async () => { await act(async () => { await Promise.resolve(); }); };
const emit = async (s: string) => {
  await act(async () => {
    // Notify the most recent subscriber (latest effect run).
    subscribers[subscribers.length - 1]?.(s);
  });
};

beforeEach(() => {
  vi.useFakeTimers();
  // Deterministic backoff (no jitter spread): center of 0.8..1.2 = 1.0.
  vi.spyOn(Math, "random").mockReturnValue(0.5);
  subscribers.length = 0;
  toastSuccess.mockClear();
  toastError.mockClear();
  removeChannel.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("RealtimeStatusBanner", () => {
  it("shows attempt count and retry countdown while disconnected", async () => {
    render(<RealtimeStatusBanner />);
    await emit("SUBSCRIBED");
    await emit("CHANNEL_ERROR");
    await flushMicro();

    // First backoff = 2000ms * 1.0 jitter = 2000ms.
    expect(screen.getByText(/Realtime disconnected/i).textContent).toMatch(/retrying in 2s/);
    const btn = screen.getByRole("button") as HTMLButtonElement;
    expect(btn.textContent).toMatch(/Retry in 2s/);
    expect(btn.disabled).toBe(true);
  });

  it("fires success toast with attempt and backoff timing after reconnect", async () => {
    render(<RealtimeStatusBanner />);
    await emit("SUBSCRIBED");
    await emit("CHANNEL_ERROR");
    // Wait out the 2s backoff → triggers auto reconnect (attempt = 1).
    await act(async () => { vi.advanceTimersByTime(2000); });
    await emit("SUBSCRIBED");

    expect(toastSuccess).toHaveBeenCalledTimes(1);
    const [, opts] = toastSuccess.mock.calls[0];
    expect(opts.description).toMatch(/attempt 1/);
    expect(opts.description).toMatch(/2\.0s backoff/);
    expect(opts.description).toMatch(/total 2\.0s/);
  });

  it("fires error toast after exhausting MAX_RETRIES with accumulated backoff", async () => {
    render(<RealtimeStatusBanner />);
    await emit("SUBSCRIBED");
    await emit("CHANNEL_ERROR");

    // Drive 8 backoff cycles, each ending in another CHANNEL_ERROR.
    // Delays: 2,4,8,16,32,60,60,60 seconds (cap 60s, attempt clamped at 5).
    const delays = [2000, 4000, 8000, 16000, 32000, 60000, 60000, 60000];
    for (const d of delays) {
      await act(async () => { vi.advanceTimersByTime(d); });
      await emit("CHANNEL_ERROR");
    }

    expect(toastError).toHaveBeenCalledTimes(1);
    const [, opts] = toastError.mock.calls[0];
    const total = delays.reduce((a, b) => a + b, 0) / 1000;
    expect(opts.description).toMatch(new RegExp(`${total.toFixed(1)}s of backoff`));
    expect(opts.description).toMatch(/8 attempts/);
  });
});
