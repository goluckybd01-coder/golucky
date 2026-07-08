import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAutoRefreshCheckout } from "@/hooks/useAutoRefreshCheckout";

describe("useAutoRefreshCheckout — expiry guard (integration)", () => {
  it("invokes onExpired only once even when many expiry ticks occur during a single in-flight refresh", async () => {
    const expiresAt = new Date(Date.now() + 1000).toISOString();
    const order = { order_id: "ORDER-A", expires_at: expiresAt };

    // A slow refresh that resolves later so we can simulate multiple ticks while in-flight.
    let resolveRefresh!: () => void;
    const refreshPromise = new Promise<void>((r) => { resolveRefresh = r; });
    const onExpired = vi.fn(() => refreshPromise);
    const onNotify = vi.fn();

    const initialProps = { order, now: Date.now(), loading: false, onExpired, onNotify };
    const { rerender } = renderHook((p) => useAutoRefreshCheckout(p), { initialProps });

    // Push `now` well past expiry and simulate 10 rapid ticks (as the 1s countdown would).
    for (let i = 0; i < 10; i++) {
      const now = Date.now() + 5000 + i * 1000;
      rerender({ order, now, loading: false, onExpired, onNotify });
    }

    expect(onExpired).toHaveBeenCalledTimes(1);
    expect(onNotify).toHaveBeenCalledTimes(1);

    // Resolve the in-flight refresh; subsequent ticks for the SAME order must not re-fire.
    await act(async () => { resolveRefresh(); await refreshPromise; });
    for (let i = 0; i < 5; i++) {
      rerender({ order, now: Date.now() + 20000 + i * 1000, loading: false, onExpired, onNotify });
    }
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it("does not fire while `loading` is true", () => {
    const order = { order_id: "ORDER-B", expires_at: new Date(0).toISOString() };
    const onExpired = vi.fn();

    renderHook(() =>
      useAutoRefreshCheckout({ order, now: Date.now(), loading: true, onExpired })
    );

    expect(onExpired).not.toHaveBeenCalled();
  });
});
