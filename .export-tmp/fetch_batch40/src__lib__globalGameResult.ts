/**
 * GLOBAL GAME RESULT SYSTEM
 * 
 * Unified event system for ALL games (K3, WinGo, 5D, TrxWin).
 * ONE event name, ONE listener, ONE modal - no per-game regressions.
 * 
 * Event: GLOBAL_GAME_RESULT
 * Dispatched ONCE per settled bet (idempotent via localStorage seen-set).
 */

export type GameName = "K3" | "WinGo" | "5D" | "TrxWin";

export interface GlobalGameResultPayload {
  game: GameName;
  duration: number;
  roundKey: string;
  tradeId: string;
  outcome: "WIN" | "LOSE";
  betType: string;
  sum: number;
  betAmount: number;
  payout: number;
  ts: number;
  // Optional game-specific data
  colors?: string[];
  dice?: [number, number, number];
  bigSmall?: "Big" | "Small";
  oddEven?: "Odd" | "Even";
}

// ============= SEEN SET (localStorage) =============

const SEEN_KEY = "GLOBAL_GAME_RESULT_SEEN";
const MAX_SEEN = 500;

const loadSeenSet = (): Set<string> => {
  try {
    const stored = localStorage.getItem(SEEN_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

const saveSeenSet = (seen: Set<string>): void => {
  try {
    const arr = Array.from(seen);
    // Keep only last MAX_SEEN entries
    const trimmed = arr.slice(-MAX_SEEN);
    localStorage.setItem(SEEN_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore storage errors
  }
};

const markAsSeen = (eventId: string): boolean => {
  const seen = loadSeenSet();
  if (seen.has(eventId)) {
    return false; // Already seen
  }
  seen.add(eventId);
  saveSeenSet(seen);
  return true; // First time
};

export const isEventSeen = (eventId: string): boolean => {
  return loadSeenSet().has(eventId);
};

export const clearSeenEvents = (): void => {
  localStorage.removeItem(SEEN_KEY);
};

// ============= EVENT ID GENERATION =============

export const createEventId = (payload: GlobalGameResultPayload): string => {
  return `${payload.game}:${payload.duration}:${payload.roundKey}:${payload.tradeId}:${payload.betType}:${payload.betAmount}`;
};

// ============= EVENT DISPATCH =============

/**
 * Dispatch GLOBAL_GAME_RESULT event (idempotent).
 * Returns true if dispatched, false if already seen (duplicate).
 */
export const dispatchGlobalGameResult = (payload: GlobalGameResultPayload): boolean => {
  const eventId = createEventId(payload);
  
  // Check if already dispatched (idempotent)
  if (!markAsSeen(eventId)) {
    console.log(`[GLOBAL_GAME_RESULT] Skipping duplicate: ${eventId}`);
    return false;
  }
  
  console.log(`[GLOBAL_GAME_RESULT] Dispatching: ${payload.game} ${payload.duration}min ${payload.outcome} bet=${payload.betAmount} payout=${payload.payout}`);
  
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("GLOBAL_GAME_RESULT", { detail: payload }));
  }
  
  return true;
};

// ============= TYPE GUARD =============

export const isGlobalGameResultEvent = (e: Event): e is CustomEvent<GlobalGameResultPayload> => {
  return e instanceof CustomEvent && e.type === "GLOBAL_GAME_RESULT" && e.detail !== null;
};
