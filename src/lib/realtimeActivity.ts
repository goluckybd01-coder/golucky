// Tiny shared store for "last realtime payload received" timestamps.
type Listener = (ts: number) => void;
const listeners = new Set<Listener>();
let lastTs: number | null = null;

export function markRealtimeActivity(ts: number = Date.now()) {
  lastTs = ts;
  listeners.forEach((l) => l(ts));
}

export function getLastRealtimeActivity() {
  return lastTs;
}

export function subscribeRealtimeActivity(l: Listener) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
