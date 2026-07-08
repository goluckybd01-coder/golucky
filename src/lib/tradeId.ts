// Professional Timestamp-based Trade ID Generator
// Format: YYYYMMDDHHmmss + 2-digit counter (e.g., 2026011415173205)

export type GameName = "winGo" | "k3" | "fiveD" | "trxWin";

const getGameKey = (gameName: GameName, gameType: string): string => {
  const typeKey = gameType === "30sec" ? "30s" : gameType === "1min" ? "1m" : gameType === "3min" ? "3m" : gameType === "5min" ? "5m" : "10m";
  return `${gameName}_${typeKey}`;
};

const getModeCode = (gameType: string): string => {
  switch (gameType) {
    case "30sec": return "A";
    case "1min": return "B";
    case "3min": return "C";
    case "5min": return "D";
    case "10min": return "E";
    default: return "B";
  }
};

const getStorageKeys = (gameKey: string) => ({
  counter: `${gameKey}_trade_counter`,
  lastBase: `${gameKey}_last_base`,
});

const formatDateToBase = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

export const generateTradeId = (gameName: GameName, gameType: string): string => {
  const gameKey = getGameKey(gameName, gameType);
  const { counter: counterKey, lastBase: lastBaseKey } = getStorageKeys(gameKey);
  const now = new Date();
  const base = formatDateToBase(now);
  const storedLastBase = localStorage.getItem(lastBaseKey) || "";
  const storedCounter = parseInt(localStorage.getItem(counterKey) || "0", 10);
  let newCounter: number;
  if (base === storedLastBase) {
    newCounter = (storedCounter + 1) % 1000;
  } else {
    newCounter = 100 + Math.floor(Math.random() * 900);
  }
  localStorage.setItem(lastBaseKey, base);
  localStorage.setItem(counterKey, String(newCounter));
  const modeCode = getModeCode(gameType);
  return `${base}${modeCode}${String(newCounter).padStart(3, '0')}`;
};

export const getGameTypeLabel = (gameType: string): string => {
  switch (gameType) {
    case "30sec": return "30S";
    case "1min": return "1MIN";
    case "3min": return "3MIN";
    case "5min": return "5MIN";
    case "10min": return "10MIN";
    default: return "30S";
  }
};
