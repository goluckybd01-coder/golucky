import type { GameType } from "@/lib/adminPermissions";

/**
 * Admin Round Sync Helpers
 *
 * Goal: Admin panel must compute the SAME round identifiers that the
 * player-facing games use, so admin-set results always match.
 */

export type AdminDuration = "30s" | "1m" | "3m" | "5m" | "10m";

export const durationToGameMode = (duration: AdminDuration): "30sec" | "1min" | "3min" | "5min" | "10min" => {
  switch (duration) {
    case "30s":
      return "30sec";
    case "1m":
      return "1min";
    case "3m":
      return "3min";
    case "5m":
      return "5min";
    case "10m":
      return "10min";
  }
};

export const gameModeToDurationMs = (gameMode: "30sec" | "1min" | "3min" | "5min" | "10min"): number => {
  switch (gameMode) {
    case "30sec":
      return 30_000;
    case "1min":
      return 60_000;
    case "3min":
      return 180_000;
    case "5min":
      return 300_000;
    case "10min":
      return 600_000;
  }
};

export const getRoundStartMs = (durationMs: number, nowMs: number = Date.now()): number => {
  return Math.floor(nowMs / durationMs) * durationMs;
};

export const getRemainingSeconds = (roundStartMs: number, durationMs: number, nowMs: number = Date.now()): number => {
  const roundEnd = roundStartMs + durationMs;
  return Math.max(0, Math.ceil((roundEnd - nowMs) / 1000));
};

// Match WinGo.tsx extractTradeIdFromRoundKey formatting (YYYYMMDDHHMMSSmmm)
export const formatMsTradeId = (timestampMs: number): string => {
  const date = new Date(timestampMs);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const mins = String(date.getMinutes()).padStart(2, "0");
  const secs = String(date.getSeconds()).padStart(2, "0");
  const ms = String(date.getMilliseconds()).padStart(3, "0");
  return `${year}${month}${day}${hours}${mins}${secs}${ms}`;
};

// Match FiveD engine tradeId: 5D-YYYYMMDD-{A|B|C|D}-{NNNN}
export const formatFiveDTradeId = (roundStartMs: number, mode: "1min" | "3min" | "5min" | "10min"): string => {
  const date = new Date(roundStartMs);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;

  const durationMin = mode === "1min" ? 1 : mode === "3min" ? 3 : mode === "5min" ? 5 : 10;
  const modeCode = ({ 1: "A", 3: "B", 5: "C", 10: "D" } as const)[durationMin] || "A";

  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const durationMs = durationMin * 60 * 1000;
  const dailySerial = Math.floor((roundStartMs - dayStart) / durationMs) + 1;

  return `5D-${dateStr}-${modeCode}-${String(dailySerial).padStart(4, "0")}`;
};

// Match TrxWin.tsx generatePeriodNumber formatting (YYYYMMDD + 5-digit serial)
export const formatTrxWinPeriod = (roundStartMs: number, durationSeconds: number): string => {
  const date = new Date(roundStartMs);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const serial = Math.floor((roundStartMs % 86_400_000) / (durationSeconds * 1000)) + 1;
  return `${year}${month}${day}${String(serial).padStart(5, "0")}`;
};

/**
 * The canonical trade_id that the GAME uses for lookups/settlement.
 * Admin must write overrides using this exact ID.
 */
export const getCanonicalTradeIdForAdmin = (
  gameType: GameType,
  gameMode: "30sec" | "1min" | "3min" | "5min" | "10min",
  roundStartMs: number
): string => {
  if (gameType === "wingo") {
    return formatMsTradeId(roundStartMs);
  }

  if (gameType === "k3") {
    // K3.tsx uses the raw roundStartMs (parts[2])
    return String(roundStartMs);
  }

  if (gameType === "5d") {
    // 5D engine uses special formatted tradeId
    return formatFiveDTradeId(roundStartMs, gameMode === "30sec" ? "1min" : gameMode);
  }

  if (gameType === "trxwin") {
    const durationSeconds = gameModeToDurationMs(gameMode) / 1000;
    return formatTrxWinPeriod(roundStartMs, durationSeconds);
  }

  // Fallback
  return String(roundStartMs);
};
