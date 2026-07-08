/**
 * PERIOD NUMBER SYSTEM
 * 
 * Generates unique, sequential period numbers for each game mode.
 * Format: YYYYMMDDHHMMSS + 3-digit sequence
 * 
 * Each game (K3, WinGo, TrxWin, FiveD) has its own period counter per mode.
 * Periods are calculated based on round start time and duration.
 */

export type GameName = "k3" | "winGo" | "trxWin" | "fiveD";
export type GameMode = "30sec" | "1min" | "3min" | "5min" | "10min";

// Base epoch for period calculation (Jan 1, 2024 00:00:00 UTC)
const EPOCH_START = new Date("2024-01-01T00:00:00Z").getTime();

// Get duration in milliseconds
const getDurationMs = (mode: GameMode): number => {
  switch (mode) {
    case "30sec": return 30 * 1000;
    case "1min": return 60 * 1000;
    case "3min": return 3 * 60 * 1000;
    case "5min": return 5 * 60 * 1000;
    case "10min": return 10 * 60 * 1000;
    default: return 60 * 1000;
  }
};

// Game-specific offsets to make period numbers unique across games
const GAME_OFFSETS: Record<GameName, number> = {
  k3: 1000000,
  winGo: 2000000,
  trxWin: 3000000,
  fiveD: 4000000,
};

// Mode-specific offsets to differentiate modes within same game
const MODE_OFFSETS: Record<GameMode, number> = {
  "30sec": 100000,
  "1min": 200000,
  "3min": 300000,
  "5min": 400000,
  "10min": 500000,
};

/**
 * Calculate period number from timestamp
 * Returns a unique, sequential number for the given game/mode/time combination
 */
export const calculatePeriodNumber = (
  game: GameName,
  mode: GameMode,
  timestamp: number
): string => {
  const durationMs = getDurationMs(mode);
  
  // Calculate which period this timestamp falls into (since epoch)
  const periodIndex = Math.floor((timestamp - EPOCH_START) / durationMs);
  
  // Create a unique base using date components for readability
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  
  // Calculate sequence number within the day
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const sequenceInDay = Math.floor((timestamp - dayStart) / durationMs);
  
  // Format: YYYYMMDD + game offset digit + mode offset digit + 4-digit sequence
  const gameDigit = { k3: 1, winGo: 2, trxWin: 3, fiveD: 4 }[game];
  const modeDigit = { "30sec": 1, "1min": 2, "3min": 3, "5min": 4, "10min": 5 }[mode];
  
  // Create period number: YYYYMMDD + game + mode + sequence (4 digits, zero-padded)
  const seqStr = String(sequenceInDay).padStart(4, "0");
  
  return `${year}${month}${day}${gameDigit}${modeDigit}${seqStr}`;
};

/**
 * Get period number from round key
 * Extracts timestamp from round key and calculates period
 */
export const getPeriodFromRoundKey = (
  game: GameName,
  mode: GameMode,
  roundKey: string
): string => {
  // Round key format: {GAME}:{duration}:{timestamp}
  const parts = roundKey.split(":");
  if (parts.length >= 3) {
    const timestamp = parseInt(parts[2]);
    if (!isNaN(timestamp)) {
      return calculatePeriodNumber(game, mode, timestamp);
    }
  }
  
  // Fallback: use current time
  return calculatePeriodNumber(game, mode, Date.now());
};

/**
 * Get current period number for a game mode
 */
export const getCurrentPeriodNumber = (
  game: GameName,
  mode: GameMode
): string => {
  return calculatePeriodNumber(game, mode, Date.now());
};

/**
 * Format period for display (add dashes for readability)
 * Input: 2024011412015
 * Output: 20240114-1-2-0015
 */
export const formatPeriodDisplay = (period: string): string => {
  if (period.length >= 14) {
    const date = period.substring(0, 8);
    const game = period.substring(8, 9);
    const mode = period.substring(9, 10);
    const seq = period.substring(10);
    return `${date}${game}${mode}${seq}`;
  }
  return period;
};

/**
 * Get previous period number
 */
export const getPreviousPeriodNumber = (
  game: GameName,
  mode: GameMode,
  currentPeriod: string
): string => {
  const durationMs = getDurationMs(mode);
  const now = Date.now();
  const prevTimestamp = now - durationMs;
  return calculatePeriodNumber(game, mode, prevTimestamp);
};

/**
 * Generate period history (last N periods)
 */
export const generatePeriodHistory = (
  game: GameName,
  mode: GameMode,
  count: number = 10
): string[] => {
  const durationMs = getDurationMs(mode);
  const now = Date.now();
  const periods: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const timestamp = now - (i * durationMs);
    periods.push(calculatePeriodNumber(game, mode, timestamp));
  }
  
  return periods;
};
