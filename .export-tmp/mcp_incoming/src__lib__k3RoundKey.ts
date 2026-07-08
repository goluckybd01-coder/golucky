/**
 * K3 ROUND KEY HELPER — SINGLE SOURCE OF TRUTH
 */
export type K3Duration = 1 | 3 | 5 | 10;
export interface ParsedRoundKey { gameId: "K3"; duration: K3Duration; tradeId: string; }
export const makeRoundKey = (duration: K3Duration, identifier: string): string => `K3:${duration}:${identifier}`;
export const parseRoundKey = (roundKey: string): ParsedRoundKey | null => {
  const parts = roundKey.split(":");
  if (parts.length !== 3 || parts[0] !== "K3") return null;
  const duration = parseInt(parts[1], 10);
  if (![1, 3, 5, 10].includes(duration)) return null;
  return { gameId: "K3", duration: duration as K3Duration, tradeId: parts[2] };
};
export const getDurationFromGameType = (gameType: string): K3Duration => {
  switch (gameType) { case "1min": return 1; case "3min": return 3; case "5min": return 5; case "10min": return 10; default: return 1; }
};
export const getGameTypeFromDuration = (duration: K3Duration): string => `${duration}min`;
