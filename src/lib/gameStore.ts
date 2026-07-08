// Deterministic client-side game store (single source of truth)
// Keeps myHistory + pending bets + settled results consistent across remounts and intervals.

// useSyncExternalStore moved to hooks/useGameStore.ts
import {
  getStorageKeys,
  loadMyHistory,
  saveMyHistory,
  loadRoundResults,
  saveRoundResult,
  getRoundResult,
  evaluateBet,
  type BetHistoryItem,
  type PendingBet,
  type GameName,
  type RoundResult,
} from "@/lib/gameStorage";

export type PendingBetsByTradeId = Record<string, PendingBet[]>;

export interface GameStoreState {
  pendingBetsByTradeId: PendingBetsByTradeId;
  settledResultsByTradeId: Record<string, RoundResult>;
  myHistoryRows: BetHistoryItem[];
}

type Listener = () => void;

type StoreKey = string;

const makeStoreKey = (gameName: GameName, gameType: string): StoreKey => `${gameName}:${gameType}`;

const listenersByKey = new Map<StoreKey, Set<Listener>>();
const stateByKey = new Map<StoreKey, GameStoreState>();

const PENDING_KEY = (gameName: GameName, gameType: string) => `${getStorageKeys(gameName, gameType).myHistory}_pendingByTradeId}`;

const notify = (key: StoreKey) => {
  const ls = listenersByKey.get(key);
  if (!ls) return;
  ls.forEach((l) => l());
};

const ensureListenerSet = (key: StoreKey) => {
  if (!listenersByKey.has(key)) listenersByKey.set(key, new Set());
  return listenersByKey.get(key)!;
};

const dedupeMyHistory = (rows: BetHistoryItem[]) => {
  const map = new Map<string, BetHistoryItem>();
  for (const r of rows) {
    const ts = r.timestamp instanceof Date ? r.timestamp.toISOString() : new Date(r.timestamp as any).toISOString();
    const tradeId = (r as any).tradeId || r.period;
    const k = `${tradeId}|${r.betType}|${r.betAmount}|${ts}`;

    const existing = map.get(k);
    if (!existing) {
      map.set(k, r);
      continue;
    }

    // Prefer resolved row over pending row
    const existingResolved = existing.result !== null;
    const nextResolved = r.result !== null;
    if (!existingResolved && nextResolved) {
      map.set(k, r);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

const loadPendingBetsByTradeId = (gameName: GameName, gameType: string): PendingBetsByTradeId => {
  try {
    const stored = localStorage.getItem(PENDING_KEY(gameName, gameType));
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const savePendingBetsByTradeId = (gameName: GameName, gameType: string, pending: PendingBetsByTradeId) => {
  localStorage.setItem(PENDING_KEY(gameName, gameType), JSON.stringify(pending));
};

const initState = (gameName: GameName, gameType: string): GameStoreState => {
  const myHistoryRows = loadMyHistory(gameName, gameType);
  const pendingBetsByTradeId = loadPendingBetsByTradeId(gameName, gameType);
  const settledResultsByTradeId = loadRoundResults(gameName);
  return {
    myHistoryRows,
    pendingBetsByTradeId,
    settledResultsByTradeId,
  };
};

const getOrInit = (gameName: GameName, gameType: string) => {
  const key = makeStoreKey(gameName, gameType);
  if (!stateByKey.has(key)) {
    stateByKey.set(key, initState(gameName, gameType));
  }
  return { key, state: stateByKey.get(key)! };
};

const persist = (gameName: GameName, gameType: string, state: GameStoreState) => {
  saveMyHistory(gameName, gameType, state.myHistoryRows);
  savePendingBetsByTradeId(gameName, gameType, state.pendingBetsByTradeId);
  // settled results persisted through saveRoundResult
};

export const gameStore = {
  subscribe(gameName: GameName, gameType: string, listener: Listener) {
    const key = makeStoreKey(gameName, gameType);
    const set = ensureListenerSet(key);
    set.add(listener);
    return () => set.delete(listener);
  },

  getSnapshot(gameName: GameName, gameType: string): GameStoreState {
    const { state } = getOrInit(gameName, gameType);
    return state;
  },

  // Refresh from localStorage and merge (prevents regression from stale closures overwriting resolved rows)
  refresh(gameName: GameName, gameType: string) {
    const { key, state } = getOrInit(gameName, gameType);
    const latestHistory = loadMyHistory(gameName, gameType);
    const latestPending = loadPendingBetsByTradeId(gameName, gameType);
    const latestResults = loadRoundResults(gameName);

    const mergedHistory = dedupeMyHistory([...state.myHistoryRows, ...latestHistory]);
    const mergedPending = { ...latestPending, ...state.pendingBetsByTradeId };

    const next: GameStoreState = {
      myHistoryRows: mergedHistory,
      pendingBetsByTradeId: mergedPending,
      settledResultsByTradeId: latestResults,
    };

    stateByKey.set(key, next);
    persist(gameName, gameType, next);
    notify(key);
  },

  addPendingBet(gameName: GameName, gameType: string, tradeId: string, pendingBet: PendingBet, historyRow: BetHistoryItem) {
    const { key, state } = getOrInit(gameName, gameType);

    const nextPending: PendingBetsByTradeId = {
      ...state.pendingBetsByTradeId,
      [tradeId]: [...(state.pendingBetsByTradeId[tradeId] || []), pendingBet],
    };

    const mergedHistory = dedupeMyHistory([historyRow, ...state.myHistoryRows]);

    const next: GameStoreState = {
      ...state,
      pendingBetsByTradeId: nextPending,
      myHistoryRows: mergedHistory,
    };

    stateByKey.set(key, next);
    persist(gameName, gameType, next);
    notify(key);
  },

  clearPendingTrade(gameName: GameName, gameType: string, tradeId: string) {
    const { key, state } = getOrInit(gameName, gameType);
    if (!state.pendingBetsByTradeId[tradeId]) return;

    const { [tradeId]: _removed, ...rest } = state.pendingBetsByTradeId;
    const next: GameStoreState = {
      ...state,
      pendingBetsByTradeId: rest,
    };

    stateByKey.set(key, next);
    persist(gameName, gameType, next);
    notify(key);
  },

  countPendingForTrade(gameName: GameName, gameType: string, tradeId: string) {
    const { state } = getOrInit(gameName, gameType);
    return state.myHistoryRows.filter((r) => (r as any).tradeId === tradeId || r.period === tradeId).filter((r) => r.result === null).length;
  },

  // Idempotent result guarantee (does not regenerate if already cached)
  ensureK3RoundResult(gameName: GameName, gameType: string, tradeId: string): RoundResult {
    const existing = getRoundResult(gameName, tradeId);
    if (existing) return existing;

    const dice: [number, number, number] = [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
    ];
    const sum = dice[0] + dice[1] + dice[2];
    const bigSmall: "Big" | "Small" = sum >= 11 ? "Big" : "Small";
    const oddEven: "Odd" | "Even" = sum % 2 === 0 ? "Even" : "Odd";

    const rr: RoundResult = {
      tradeId,
      gameType,
      dice,
      sum,
      bigSmall,
      oddEven,
      endedAt: new Date().toISOString(),
    };

    saveRoundResult(gameName, rr);
    return rr;
  },

  resolvePendingForTradeId(
    gameName: GameName,
    gameType: string,
    tradeId: string,
    claimWinnings?: (amount: number, game: string, tradeId: string) => void
  ) {
    const { key, state } = getOrInit(gameName, gameType);

    const roundResult = getRoundResult(gameName, tradeId);
    if (!roundResult) {
      return { resolvedCount: 0, winCount: 0, loseCount: 0, totalPayout: 0, totalBetAmount: 0, roundResult: null as RoundResult | null };
    }

    let resolvedCount = 0;
    let winCount = 0;
    let loseCount = 0;
    let totalPayout = 0;
    let totalBetAmount = 0;

    const updatedHistory = state.myHistoryRows.map((row) => {
      const rowTradeId = (row as any).tradeId || row.period;
      if (rowTradeId !== tradeId) return row;
      if (row.result !== null) return row;

      const { isWin, payout } = evaluateBet(row, roundResult, gameName);

      resolvedCount++;
      totalBetAmount += row.betAmount;
      totalPayout += payout;
      if (isWin) winCount++; else loseCount++;

      if (isWin && payout > 0 && claimWinnings) {
        claimWinnings(payout, gameName === "k3" ? "K3" : "Win Go", tradeId);
      }

      return {
        ...row,
        result: roundResult.sum,
        isWin,
        payout,
      };
    });

    if (resolvedCount > 0) {
      const { [tradeId]: _removed, ...restPending } = state.pendingBetsByTradeId;
      const next: GameStoreState = {
        ...state,
        myHistoryRows: updatedHistory,
        pendingBetsByTradeId: restPending,
        settledResultsByTradeId: loadRoundResults(gameName),
      };

      // DEV assertions
      if (import.meta.env.DEV) {
        const pendingBefore = state.myHistoryRows.filter((r) => ((r as any).tradeId || r.period) === tradeId && r.result === null).length;
        console.log(`[SETTLED] tradeId=${tradeId} resolvedCount=${resolvedCount} pendingBefore=${pendingBefore}`);
      }

      stateByKey.set(key, next);
      persist(gameName, gameType, next);
      notify(key);
    }

    return { resolvedCount, winCount, loseCount, totalPayout, totalBetAmount, roundResult };
  },

  resolveAllPendingWithCache(
    gameName: GameName,
    gameType: string,
    claimWinnings?: (amount: number, game: string, tradeId: string) => void
  ) {
    const { state } = getOrInit(gameName, gameType);
    const pendingTradeIds = Array.from(
      new Set(state.myHistoryRows.filter((r) => r.result === null).map((r) => (r as any).tradeId || r.period))
    );

    let totalResolved = 0;
    const resolvedTradeIds: string[] = [];

    for (const tid of pendingTradeIds) {
      const rr = getRoundResult(gameName, tid);
      if (!rr) continue;
      const res = this.resolvePendingForTradeId(gameName, gameType, tid, claimWinnings);
      if (res.resolvedCount > 0) {
        totalResolved += res.resolvedCount;
        resolvedTradeIds.push(tid);
      }
    }

    return { totalResolved, resolvedTradeIds };
  },
};

// Note: useGameStore hook is now defined in src/hooks/useGameStore.ts
// to prevent circular dependencies during incremental builds
