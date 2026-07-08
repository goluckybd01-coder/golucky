import { useEffect, useRef } from "react";

/**
 * Guarded auto-refresh for expiring checkout orders.
 *
 * Guarantees:
 *   1. `onExpired` runs at most once per unique `order.order_id`.
 *   2. While an `onExpired` invocation is in flight, further expiry ticks
 *      (same order OR a new order that also expires) are ignored.
 *   3. `loading` externally can also block firing.
 */
export function useAutoRefreshCheckout(opts: {
  order: { order_id: string; expires_at: string } | null;
  now: number;
  loading: boolean;
  onExpired: () => Promise<unknown> | void;
  onNotify?: () => void;
}) {
  const autoRefreshedRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);

  const { order, now, loading, onExpired, onNotify } = opts;

  useEffect(() => {
    if (!order) {
      autoRefreshedRef.current = null;
      return;
    }
    if (loading || inFlightRef.current) return;
    if (autoRefreshedRef.current === order.order_id) return;
    const remaining = new Date(order.expires_at).getTime() - now;
    if (remaining > 0) return;

    autoRefreshedRef.current = order.order_id;
    inFlightRef.current = true;
    onNotify?.();
    Promise.resolve(onExpired()).finally(() => {
      inFlightRef.current = false;
    });
  }, [order, now, loading, onExpired, onNotify]);
}
