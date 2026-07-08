/**
 * SHARED GAME ENGINE BASE - FOUNDATION FOR ALL GAMES
 * 
 * This is the SINGLE SOURCE OF TRUTH for game timing and settlement.
 * K3, WinGo, 5D, and TrxWin all extend this base.
 * 
 * Features:
 * - ONE interval drives ALL durations simultaneously
 * - Round transitions detected per duration independently
 * - Settlement triggered on round change, not UI state
 * - Uses deterministic roundKey = {gameId}:{duration}:{roundStartTimestamp}
 * - Idempotent settlement with seen result tracking
 * - Global CustomEvent dispatch for cross-component communication
 * 
 * DO NOT CHANGE KEY FORMAT — used across settlement/history/cache
 */

// ============= TYPES =============

export type GameDuration = number; // Duration in minutes (e.g., 1, 3, 5, 10, 0.5 for 30sec)

export interface DurationState {
  roundIndex: number;
  roundKey: string;
  remainingMs: number;
  roundStartMs: number;
  roundEndMs: number;
}

export interface BaseRoundResult {
  tradeId: string;
  gameType: string;
  endedAt: string;
  duration: GameDuration;
  roundKey: string;
}

export interface BaseBetResult {
  duration: GameDuration;
  roundKey: string;
  tradeId: string;
  outcome: "WIN" | "LOSE";
  betType: string;
  betAmount: number;
  payout: number;
  ts: number;
}

export interface EngineCallbacks<TResult extends BaseRoundResult> {
  onTick?: (states: Record<GameDuration, DurationState>) => void;
  onRoundEnd?: (duration: GameDuration, roundKey: string, result: TResult) => void;
}

export type SettlementListener<TResult extends BaseRoundResult> = (
  duration: GameDuration,
  roundKey: string,
  result: TResult,
  settledAt: number
) => void;

export type ResultListener<TBetResult extends BaseBetResult> = (event: TBetResult) => void;

// ============= STORAGE HELPERS =============

const getSeenKey = (gameId: string) => `${gameId}_SEEN_RESULTS`;
const getSettledKey = (gameId: string) => `${gameId}_settledRounds`;
const getResultsKey = (gameId: string) => `${gameId}_roundResults`;

export const markSeen = (gameId: string, id: string): void => {
  const key = getSeenKey(gameId);
  try {
    const seen = JSON.parse(localStorage.getItem(key) || "[]");
    if (!seen.includes(id)) {
      seen.push(id);
      localStorage.setItem(key, JSON.stringify(seen.slice(-500)));
    }
  } catch {
    localStorage.setItem(key, JSON.stringify([id]));
  }
};

export const isSeen = (gameId: string, id: string): boolean => {
  const key = getSeenKey(gameId);
  try {
    const seen = JSON.parse(localStorage.getItem(key) || "[]");
    return seen.includes(id);
  } catch {
    return false;
  }
};

export const clearSeen = (gameId: string): void => {
  localStorage.removeItem(getSeenKey(gameId));
};

// ============= ROUND KEY UTILITIES =============

export const makeRoundKey = (gameId: string, duration: GameDuration, identifier: string): string => {
  return `${gameId}:${duration}:${identifier}`;
};

export const parseRoundKey = (roundKey: string): { gameId: string; duration: GameDuration; identifier: string } | null => {
  const parts = roundKey.split(":");
  if (parts.length !== 3) return null;
  
  const duration = parseFloat(parts[1]);
  if (isNaN(duration)) return null;
  
  return {
    gameId: parts[0],
    duration,
    identifier: parts[2],
  };
};

// ============= BASE ENGINE CLASS =============

export interface GameEngineConfig<TResult extends BaseRoundResult, TBetResult extends BaseBetResult> {
  gameId: string;
  durations: GameDuration[];
  tickIntervalMs?: number;
  debug?: boolean;
  
  // Game-specific callbacks
  generateResult: (duration: GameDuration, roundKey: string) => TResult;
  evaluateBet: (bet: any, result: TResult) => { isWin: boolean; payout: number };
  loadBetHistory: (gameType: string) => any[];
  saveBetHistory: (gameType: string, history: any[]) => void;
  createBetResult: (duration: GameDuration, roundKey: string, bet: any, result: TResult, isWin: boolean, payout: number) => TBetResult;
  
  // CRITICAL: Map duration to gameType string (e.g., 0.5 -> "30sec", 1 -> "1min")
  // This fixes WinGo where 0.5min !== "30sec"
  getGameType: (duration: GameDuration) => string;
}

export class GameEngineBase<TResult extends BaseRoundResult, TBetResult extends BaseBetResult> {
  private gameId: string;
  private durations: GameDuration[];
  private tickIntervalMs: number;
  private debug: boolean;
  
  private intervalId: number | null = null;
  private prevRoundIndexMap: Record<GameDuration, number> = {};
  private currentStates: Record<GameDuration, DurationState> = {} as any;
  
  private callbacks: EngineCallbacks<TResult> = {};
  private settlementListeners: Set<SettlementListener<TResult>> = new Set();
  private resultListeners: Set<ResultListener<TBetResult>> = new Set();
  
  private config: GameEngineConfig<TResult, TBetResult>;
  
  constructor(config: GameEngineConfig<TResult, TBetResult>) {
    this.gameId = config.gameId;
    this.durations = config.durations;
    this.tickIntervalMs = config.tickIntervalMs || 250;
    this.debug = config.debug || false;
    this.config = config;
    
    // Initialize round index map
    this.durations.forEach(d => {
      this.prevRoundIndexMap[d] = -1;
    });
  }
  
  // ============= STORAGE METHODS =============
  
  private loadSettledRounds(): Record<string, boolean> {
    try {
      const stored = localStorage.getItem(getSettledKey(this.gameId));
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }
  
  private markRoundSettled(roundKey: string): void {
    const settled = this.loadSettledRounds();
    settled[roundKey] = true;
    
    const entries = Object.entries(settled);
    if (entries.length > 200) {
      const trimmed = Object.fromEntries(entries.slice(-200));
      localStorage.setItem(getSettledKey(this.gameId), JSON.stringify(trimmed));
    } else {
      localStorage.setItem(getSettledKey(this.gameId), JSON.stringify(settled));
    }
  }
  
  private isRoundSettled(roundKey: string): boolean {
    return this.loadSettledRounds()[roundKey] === true;
  }
  
  private loadRoundResults(): Record<string, TResult> {
    try {
      const stored = localStorage.getItem(getResultsKey(this.gameId));
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }
  
  private saveRoundResult(result: TResult): void {
    const results = this.loadRoundResults();
    results[result.roundKey] = result;
    
    const entries = Object.entries(results);
    if (entries.length > 100) {
      const trimmed = Object.fromEntries(entries.slice(-100));
      localStorage.setItem(getResultsKey(this.gameId), JSON.stringify(trimmed));
    } else {
      localStorage.setItem(getResultsKey(this.gameId), JSON.stringify(results));
    }
  }
  
  // ============= ROUND STATE CALCULATION =============
  
  private getDurationSeconds(duration: GameDuration): number {
    return duration * 60; // duration is in minutes
  }
  
  private calculateRoundState(duration: GameDuration, now: number): DurationState {
    const durationMs = this.getDurationSeconds(duration) * 1000;
    const roundIndex = Math.floor(now / durationMs);
    const roundStartMs = roundIndex * durationMs;
    const roundEndMs = roundStartMs + durationMs;
    const remainingMs = roundEndMs - now;
    const roundKey = makeRoundKey(this.gameId, duration, String(roundStartMs));
    
    return {
      roundIndex,
      roundKey,
      remainingMs,
      roundStartMs,
      roundEndMs,
    };
  }
  
  // ============= RESULT MANAGEMENT =============
  
  private getOrCreateRoundResult(duration: GameDuration, roundKey: string): TResult {
    const cached = this.loadRoundResults()[roundKey];
    if (cached) {
      if (this.debug) console.log(`[${this.gameId} ENGINE] Cache HIT for ${roundKey}`);
      return cached;
    }
    
    const result = this.config.generateResult(duration, roundKey);
    this.saveRoundResult(result);
    
    if (this.debug) console.log(`[${this.gameId} ENGINE] Cache MISS, created result for ${roundKey}`);
    
    return result;
  }
  
  public getRoundResult(roundKey: string): TResult | null {
    return this.loadRoundResults()[roundKey] || null;
  }
  
  // ============= SETTLEMENT =============
  
  private emitBetResult(event: TBetResult, result: TResult): void {
    const eventId = `${event.duration}:${event.roundKey}:${event.tradeId}:${event.betType}:${event.betAmount}`;
    
    if (isSeen(this.gameId, eventId)) {
      if (this.debug) console.log(`[${this.gameId} RESULT] Skipping duplicate: ${eventId}`);
      return;
    }
    
    markSeen(this.gameId, eventId);
    
    if (this.debug) {
      console.log(`[${this.gameId} RESULT] ${event.outcome}: ${event.betType} on ${event.duration}min, bet=${event.betAmount}, payout=${event.payout}`);
    }
    
    this.resultListeners.forEach(listener => {
      try {
        listener(event);
      } catch (e) {
        console.error(`[${this.gameId} ENGINE] Result listener error:`, e);
      }
    });
    
    // Dispatch GLOBAL_GAME_RESULT event (unified for all games)
    if (typeof window !== "undefined") {
      // Import dynamically to avoid circular dependencies
      import("@/lib/globalGameResult").then(({ dispatchGlobalGameResult }) => {
        dispatchGlobalGameResult({
          game: this.gameId as any,
          duration: event.duration,
          roundKey: event.roundKey,
          tradeId: event.tradeId,
          outcome: event.outcome,
          betType: event.betType,
          sum: this.getResultValue(result),
          betAmount: event.betAmount,
          payout: event.payout,
          ts: event.ts,
          // Game-specific data
          colors: (result as any).colors,
          dice: (result as any).dice,
          bigSmall: (result as any).bigSmall,
          oddEven: (result as any).oddEven,
        });
      });
      
      // Also dispatch legacy game-specific event for backward compatibility
      window.dispatchEvent(new CustomEvent(`${this.gameId}_RESULT`, { detail: event }));
    }
  }
  
  private settleRoundForDuration(duration: GameDuration, roundKey: string, result: TResult): void {
    if (this.isRoundSettled(roundKey)) {
      if (this.debug) console.log(`[${this.gameId} ENGINE] Round ${roundKey} already settled, skipping`);
      return;
    }
    
    // Use config's getGameType for proper duration->gameType mapping (fixes WinGo 0.5 -> "30sec")
    const gameType = this.config.getGameType(duration);
    const betHistory = this.config.loadBetHistory(gameType);
    
    if (this.debug) console.log(`[${this.gameId} ENGINE] Settling ${roundKey} for gameType=${gameType}, pendingBets=${betHistory.filter((e: any) => e.result === null).length}`);
    
    let resolvedCount = 0;
    // Use map() to update ALL matching rows (not find())
    const updatedHistory = betHistory.map((entry: any) => {
      if (entry.result !== null) return entry;
      
      // Match by roundKey (primary) OR by constructing roundKey from entry data
      const entryRoundKey = entry.roundKey || makeRoundKey(this.gameId, entry.duration || duration, entry.period);
      if (entryRoundKey !== roundKey) return entry;
      
      const { isWin, payout } = this.config.evaluateBet(entry, result);
      resolvedCount++;
      
      if (this.debug) console.log(`[${this.gameId} ENGINE] Resolved bet: ${entry.betType} -> ${isWin ? "WIN" : "LOSE"}, payout=${payout}`);
      
      const betResult = this.config.createBetResult(duration, roundKey, entry, result, isWin, payout);
      this.emitBetResult(betResult, result);
      
      return {
        ...entry,
        result: this.getResultValue(result),
        isWin,
        payout,
      };
    });
    
    if (resolvedCount > 0) {
      this.config.saveBetHistory(gameType, updatedHistory);
      if (this.debug) console.log(`[${this.gameId} ENGINE] Settled ${resolvedCount} bets for ${roundKey}`);
    }
    
    this.markRoundSettled(roundKey);
    
    const settledAt = Date.now();
    if (this.callbacks.onRoundEnd) {
      this.callbacks.onRoundEnd(duration, roundKey, result);
    }
    
    this.settlementListeners.forEach(listener => {
      try {
        listener(duration, roundKey, result, settledAt);
      } catch (e) {
        console.error(`[${this.gameId} ENGINE] Settlement listener error:`, e);
      }
    });
  }
  
  // Override in subclasses to extract result value (e.g., sum for K3, number for WinGo)
  protected getResultValue(result: TResult): any {
    return (result as any).sum || (result as any).number || 0;
  }
  
  // ============= SWEEP RESOLVER =============
  
  public sweepPendingBets(): number {
    const roundResults = this.loadRoundResults();
    let totalResolved = 0;
    
    for (const duration of this.durations) {
      // Use config's getGameType for proper duration->gameType mapping
      const gameType = this.config.getGameType(duration);
      const betHistory = this.config.loadBetHistory(gameType);
      
      let resolvedCount = 0;
      // Use map() to update ALL matching rows (not find())
      const updatedHistory = betHistory.map((entry: any) => {
        if (entry.result !== null) return entry;
        
        const entryRoundKey = entry.roundKey || makeRoundKey(this.gameId, entry.duration || duration, entry.period);
        const result = roundResults[entryRoundKey];
        if (!result) return entry;
        
        if (this.isRoundSettled(entryRoundKey)) return entry;
        
        const { isWin, payout } = this.config.evaluateBet(entry, result);
        resolvedCount++;
        
        if (this.debug) console.log(`[${this.gameId} SWEEP] Resolved pending bet: ${entry.betType} for ${entryRoundKey}`);
        
        return {
          ...entry,
          result: this.getResultValue(result),
          isWin,
          payout,
        };
      });
      
      if (resolvedCount > 0) {
        this.config.saveBetHistory(gameType, updatedHistory);
        totalResolved += resolvedCount;
      }
    }
    
    return totalResolved;
  }
  
  // ============= MAIN TICK =============
  
  private tick(): void {
    const now = Date.now();
    
    for (const duration of this.durations) {
      const state = this.calculateRoundState(duration, now);
      this.currentStates[duration] = state;
      
      if (this.prevRoundIndexMap[duration] >= 0 && state.roundIndex !== this.prevRoundIndexMap[duration]) {
        const prevRoundStartMs = this.prevRoundIndexMap[duration] * this.getDurationSeconds(duration) * 1000;
        const prevRoundKey = makeRoundKey(this.gameId, duration, String(prevRoundStartMs));
        
        if (this.debug) {
          console.log(`[${this.gameId} ENGINE] Round transition for ${duration}min: ${prevRoundKey} -> ${state.roundKey}`);
        }
        
        const result = this.getOrCreateRoundResult(duration, prevRoundKey);
        this.settleRoundForDuration(duration, prevRoundKey, result);
      }
      
      this.prevRoundIndexMap[duration] = state.roundIndex;
    }
    
    if (this.callbacks.onTick) {
      this.callbacks.onTick({ ...this.currentStates });
    }
  }
  
  // ============= PUBLIC API =============
  
  public start(callbacks: EngineCallbacks<TResult> = {}): () => void {
    this.callbacks = callbacks;
    
    if (this.intervalId !== null) {
      if (this.debug) console.log(`[${this.gameId} ENGINE] Already running, updated callbacks`);
      this.tick();
      return () => {};
    }
    
    if (this.debug) console.log(`[${this.gameId} ENGINE] Starting with ${this.tickIntervalMs}ms tick`);
    
    const now = Date.now();
    for (const duration of this.durations) {
      const state = this.calculateRoundState(duration, now);
      this.prevRoundIndexMap[duration] = state.roundIndex;
      this.currentStates[duration] = state;
    }
    
    this.sweepPendingBets();
    this.intervalId = window.setInterval(() => this.tick(), this.tickIntervalMs);
    this.tick();
    
    return () => {};
  }
  
  public stop(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
      this.durations.forEach(d => {
        this.prevRoundIndexMap[d] = -1;
      });
      if (this.debug) console.log(`[${this.gameId} ENGINE] Stopped`);
    }
  }
  
  public isRunning(): boolean {
    return this.intervalId !== null;
  }
  
  public getRoundState(duration: GameDuration): DurationState | null {
    return this.currentStates[duration] || null;
  }
  
  public getCurrentRoundKey(duration: GameDuration): string {
    const state = this.currentStates[duration];
    if (state) return state.roundKey;
    
    const now = Date.now();
    return this.calculateRoundState(duration, now).roundKey;
  }
  
  public getRemainingSeconds(duration: GameDuration): number {
    const state = this.currentStates[duration];
    if (state) return Math.max(0, Math.ceil(state.remainingMs / 1000));
    
    const now = Date.now();
    return Math.max(0, Math.ceil(this.calculateRoundState(duration, now).remainingMs / 1000));
  }
  
  public addSettlementListener(listener: SettlementListener<TResult>): () => void {
    this.settlementListeners.add(listener);
    return () => this.settlementListeners.delete(listener);
  }
  
  public addResultListener(listener: ResultListener<TBetResult>): () => void {
    this.resultListeners.add(listener);
    return () => this.resultListeners.delete(listener);
  }
  
  public getGameId(): string {
    return this.gameId;
  }
  
  public getDurations(): GameDuration[] {
    return [...this.durations];
  }
}
