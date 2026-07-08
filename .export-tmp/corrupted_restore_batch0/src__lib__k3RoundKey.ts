/**
 * K3 ROUND KEY HELPER — SINGLE SOURCE OF TRUTH
 * 
 * DO NOT CHANGE KEY FORMAT — used across settlement/history/cache
 * 
 * The roundKey uniquely identifies a round by combining:
 * - gameId: "K3" (fixed for K3 game)
 * - duration: The game duration in minutes (1, 3, 5, or 10)
 * - tradeId: The unique trade ID for the round
 * 
 * Format: K3:{duration}:{tradeId}
 * Example: K3:3:20260114080008032-482
 */

export type K3Duration = 1 | 3 | 5 | 10;

export interface ParsedRoundKey {
  gameId: "K3";
  duration: K3Duration;
  tradeId: string;
}

/**
 * Creates a strict round key combining game ID, duration, and trade ID.
 * This is the ONLY way to create round keys — ensures consistency across the app.
 * 
 * @param duration - Game duration in minutes (1, 3, 5, or 10)
 * @param identifier - The unique identifier for the round (tradeId or roundStartMs)
 * @returns A composite round key string
 */
export const makeRoundKey = (duration: K3Duration, identifier: string): string => {
  return `K3:${duration}:${identifier}`;
};

/**
 * Parses a round key back into its components.
 * Returns null if the key format is invalid.
 * 
 * @param roundKey - The composite round key to parse
 * @returns Parsed components or null if invalid
 */
export const parseRoundKey = (roundKey: string): ParsedRoundKey | null => {
  const parts = roundKey.split(":");
  if (parts.length !== 3 || parts[0] !== "K3") {
    return null;
  }
  
  const duration = parseInt(parts[1], 10);
  if (![1, 3, 5, 10].includes(duration)) {
    return null;
  }
  
  return {
    gameId: "K3",
    duration: duration as K3Duration,
    tradeId: parts[2],
  };
};

/**
 * Extracts duration in minutes from a game type ID (e.g., "3min" -> 3)
 * 
 * @param gameType - The game type ID (e.g., "1min", "3min", "5min", "10min")
 * @returns Duration in minutes
 */
export const getDurationFromGameType = (gameType: string): K3Duration => {
  switch (gameType) {
    case "1min": return 1;
    case "3min": return 3;
    case "5min": return 5;
    case "10min": return 10;
    default: return 1;
  }
};

/**
 * Gets the game type ID from duration (e.g., 3 -> "3min")
 * 
 * @param duration - Duration in minutes
 * @returns Game type ID string
 */
export const getGameTypeFromDuration = (duration: K3Duration): string => {
  return `${duration}min`;
};
