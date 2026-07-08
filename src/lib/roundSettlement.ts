// Unified Round Settlement Logic - Single Source of Truth
// Both WinGo and K3 use this exact same logic
//
// DO NOT CHANGE KEY FORMAT — used across settlement/history/cache

// DEBUG FLAG - set to true to enable K3 settlement traces
const DEBUG_K3 = true;

import { calculatePayout, GAME_ODDS } from "@/lib/payout";
import { 
  saveMyHistory, 
  saveGameHistory, 
  saveRoundResult,
  getRoundResult,
  type BetHistoryItem, 
  type PendingBet, 
  type ResultData, 
  type RoundResult 
} from "@/lib/gameStorage";
import { makeRoundKey, getDurationFromGameType, type K3Duration } from "@/lib/k3RoundKey";

// K3 specific odds
const K3_NUMBER_ODDS: Record<number, number> = {
  3: 207.36, 4: 69.12, 5: 34.56, 6: 20.74,
  7: 13.83, 8: 9.88, 9: 8.3, 10: 7.68,
  11: 7.68, 12: 8.3, 13: 9.88, 14: 13.83,
  15: 20.74, 16: 34.56, 17: 69.12, 18: 207.36,
};

// WinGo number colors
export const getNumberColors = (num: number): string[] => {
  if (num === 0) return ["violet", "red"];
  if (num === 5) return ["violet", "green"];
  if ([1, 3, 7, 9].includes(num)) return ["green"];
  return ["red"];
};

// K3 pattern type from dice
export const getK3PatternType = (dice: [number, number, number]): string => {
  const sorted = [...dice].sort();
  const unique = new Set(dice).size;
  
  if (unique === 1) return "3 same numbers";
  if (unique === 2) return "2 same numbers";
  if (sorted[2] - sorted[0] === 2 && sorted[1] - sorted[0] === 1) return "3 consecutive numbers";
  return "3 different numbers";
};

// Generate K3 dice results
export const generateK3Dice = (): [number, number, number] => {
  return [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
  ];
};

export interface SettlementConfig {
  gameName: "winGo" | "k3";
  gameType: string;
  currentTradeId: string;
  pendingBets: PendingBet[]; // Array to support multiple bets per round
  myBetHistory: BetHistoryItem[];
  gameHistory: any[];
  recentResults?: number[];
  lastTradeIdRef: React.MutableRefObject<string>;
  claimWinnings: (amount: number, game: string, tradeId: string) => void;
  playResultSound: (isWin: boolean, tradeId: string) => void;
}

export interface SettlementResult {
  // Generated result data
  finalizedTradeId: string;
  resultNumber: number; // WinGo: 0-9, K3: sum 3-18
  colors: string[]; // WinGo only
  bigSmall: "Big" | "Small";
  dice?: [number, number, number]; // K3 only
  oddEven?: "Odd" | "Even"; // K3 only
  pattern?: string; // K3 only
  
  // History updates
  newHistoryItem: any;
  updatedHistory: any[];
  updatedRecentResults?: number[];
  updatedMyHistory: BetHistoryItem[];
  
  // Result modal data
  resultData: ResultData;
  
  // Bet resolution - now aggregated across ALL bets
  hasBet: boolean;
  hasAnyWin: boolean; // true if any bet won
  totalPayout: number; // sum of all payouts
  resolvedBetsCount: number; // how many bets were resolved
  
  // K3 specific
  roundKey?: string;
  duration?: K3Duration;
}

/**
 * Unified settlement logic - generates result, resolves bets, updates history
 * This is the SINGLE SOURCE OF TRUTH for round settlement
 * 
 * CRITICAL: Uses currentTradeId as the period ID for the round being settled.
 * For K3: Uses roundKey (K3:{duration}:{tradeId}) for strict duration isolation.
 * This ensures bet matching works correctly - bets placed with tradeId X
 * are settled and recorded under period X, isolated by duration.
 */
export function settleRound(config: SettlementConfig): SettlementResult {
  const {
    gameName,
    gameType,
    currentTradeId,
    pendingBets, // Array of all pending bets
    myBetHistory,
    gameHistory,
    recentResults = [],
    lastTradeIdRef,
    claimWinnings,
    playResultSound,
  } = config;

  // K3: Extract duration and create roundKey
  const duration = gameName === "k3" ? getDurationFromGameType(gameType) : undefined;
  const roundKey = gameName === "k3" && duration ? makeRoundKey(duration, currentTradeId) : undefined;

  // DEBUG: Log onRoundEnd event
  if (DEBUG_K3 && gameName === "k3") {
    const cachedResult = roundKey ? getRoundResult("k3", roundKey) : null;
    console.log(`[K3 DEBUG] onRoundEnd | duration=${duration}min | roundKey=${roundKey} | cachedResult=${cachedResult ? "EXISTS" : "NEW"} | pendingBets=${pendingBets.length}`);
  }

  // === STEP 1: Generate Results ===
  let resultNumber: number;
  let colors: string[] = [];
  let bigSmall: "Big" | "Small";
  let dice: [number, number, number] | undefined;
  let oddEven: "Odd" | "Even" | undefined;
  let pattern: string | undefined;

  if (gameName === "k3") {
    // K3: Generate 3 dice, sum determines result
    dice = generateK3Dice();
    resultNumber = dice[0] + dice[1] + dice[2];
    bigSmall = resultNumber >= 11 ? "Big" : "Small";
    oddEven = resultNumber % 2 === 0 ? "Even" : "Odd";
    pattern = getK3PatternType(dice);
  } else {
    // WinGo: Generate 0-9
    resultNumber = Math.floor(Math.random() * 10);
    colors = getNumberColors(resultNumber);
    bigSmall = resultNumber >= 5 ? "Big" : "Small";
  }

  // === STEP 2: Use currentTradeId as the finalized period ID ===
  // CRITICAL FIX: Do NOT generate a new trade ID here!
  const finalizedTradeId = currentTradeId;
  lastTradeIdRef.current = finalizedTradeId;

  // === STEP 3: Create History Item ===
  let newHistoryItem: any;
  if (gameName === "k3") {
    newHistoryItem = {
      period: finalizedTradeId,
      dice,
      sum: resultNumber,
      bigSmall,
      oddEven,
      pattern,
      duration, // Store duration for filtering
      roundKey, // Store roundKey for reference
    };
  } else {
    newHistoryItem = {
      period: finalizedTradeId,
      number: resultNumber,
      bigSmall,
      colors,
    };
  }

  // Update game history
  const updatedHistory = [newHistoryItem, ...gameHistory.slice(0, 10)];
  saveGameHistory(gameName, gameType, updatedHistory);

  // Update recent results (WinGo only)
  const updatedRecentResults = gameName === "winGo" 
    ? [resultNumber, ...recentResults.slice(0, 4)]
    : undefined;

  // === STEP 3.5: SAVE ROUND RESULT TO CACHE ===
  // For K3: Uses roundKey as the cache key (duration-isolated)
  // This is critical for the Pending Sweep Resolver to work
  const roundResult: RoundResult = {
    tradeId: finalizedTradeId,
    gameType,
    sum: resultNumber,
    bigSmall,
    endedAt: new Date().toISOString(),
    ...(gameName === "k3" && { dice, oddEven, duration, roundKey }),
    ...(gameName === "winGo" && { colors }),
  };
  saveRoundResult(gameName, roundResult);

  // === STEP 4: Resolve ALL Pending Bets for this round ===
  // CRITICAL FIX: Resolve ALL bets matching roundKey (K3) or tradeId+gameType (WinGo)
  // Uses filter().map() pattern to update ALL matches (never find())
  let betsThisRound: PendingBet[];
  
  if (gameName === "k3" && roundKey) {
    // K3: Match by roundKey for strict duration isolation
    betsThisRound = pendingBets.filter(
      bet => bet.roundKey === roundKey || 
             (bet.gameType === gameType && bet.tradeId === currentTradeId && bet.duration === duration)
    );
  } else {
    // WinGo: Match by gameType + tradeId
    betsThisRound = pendingBets.filter(
      bet => bet.gameType === gameType && bet.tradeId === currentTradeId
    );
  }

  const hasBet = betsThisRound.length > 0;
  let hasAnyWin = false;
  let totalPayout = 0;
  let resolvedBetsCount = 0;
  let updatedMyHistory = [...myBetHistory];
  let lastBetAmount = 0; // For result modal display
  let resultData: ResultData;

  // Process EACH pending bet for this round (map/filter pattern, NOT find)
  for (const pendingBet of betsThisRound) {
    let isWin = false;
    let winOdds = 0;

    if (gameName === "k3") {
      // K3 bet resolution
      if (pendingBet.betKind === "number") {
        isWin = pendingBet.betValue === resultNumber;
        winOdds = K3_NUMBER_ODDS[pendingBet.betValue as number] || 2;
      } else {
        const betVal = String(pendingBet.betValue).toLowerCase();
        if (betVal === "big") {
          isWin = bigSmall === "Big";
          winOdds = 1.92;
        } else if (betVal === "small") {
          isWin = bigSmall === "Small";
          winOdds = 1.92;
        } else if (betVal === "odd") {
          isWin = oddEven === "Odd";
          winOdds = 1.92;
        } else if (betVal === "even") {
          isWin = oddEven === "Even";
          winOdds = 1.92;
        }
      }
    } else {
      // WinGo bet resolution
      if (pendingBet.betKind === "number") {
        isWin = typeof pendingBet.betValue === "number" && pendingBet.betValue === resultNumber;
        winOdds = GAME_ODDS.winGo.number;
      } else if (pendingBet.betKind === "color") {
        const color = pendingBet.betValue as "green" | "violet" | "red";
        isWin = colors.includes(color);
        winOdds = color === "violet" ? GAME_ODDS.winGo.violet : GAME_ODDS.winGo.color;
      } else {
        const bs = pendingBet.betValue as "Big" | "Small";
        isWin = bs === bigSmall;
        winOdds = GAME_ODDS.winGo.bigSmall;
      }
    }

    const finalPayout = isWin ? calculatePayout(pendingBet.totalStake, winOdds) : 0;
    
    if (isWin) hasAnyWin = true;
    totalPayout += finalPayout;
    resolvedBetsCount++;
    lastBetAmount = pendingBet.totalStake;

    // Claim winnings for this bet
    if (isWin && finalPayout > 0) {
      claimWinnings(finalPayout, gameName === "k3" ? "K3" : "Win Go", finalizedTradeId);
    }

    // Create bet type label
    const betTypeLabel = pendingBet.betKind === "number"
      ? (gameName === "k3" ? `Sum ${pendingBet.betValue}` : `Number ${pendingBet.betValue}`)
      : pendingBet.betKind === "color"
        ? String(pendingBet.betValue).charAt(0).toUpperCase() + String(pendingBet.betValue).slice(1)
        : String(pendingBet.betValue);

    // Find the MATCHING pending entry in myHistory by period AND betType (to handle multiple bets)
    // For K3: Also match by roundKey if available for strict duration isolation
    const existingIndex = updatedMyHistory.findIndex((h) => {
      const periodMatch = h.period === currentTradeId;
      const pendingMatch = h.result === null;
      const betTypeMatch = h.betType === betTypeLabel;
      const amountMatch = h.betAmount === pendingBet.totalStake;
      
      // For K3: Also check roundKey if stored
      if (gameName === "k3" && roundKey && h.roundKey) {
        return h.roundKey === roundKey && pendingMatch && betTypeMatch && amountMatch;
      }
      
      return periodMatch && pendingMatch && betTypeMatch && amountMatch;
    });
    
    const confirmedBet: BetHistoryItem = {
      period: finalizedTradeId,
      betType: betTypeLabel,
      betAmount: pendingBet.totalStake,
      result: resultNumber,
      isWin,
      payout: finalPayout,
      timestamp: existingIndex >= 0 ? updatedMyHistory[existingIndex].timestamp : new Date(pendingBet.createdAt),
      // K3 specific fields for duration isolation
      ...(gameName === "k3" && { duration, roundKey }),
    };

    // Update existing or prepend new (idempotent)
    if (existingIndex >= 0) {
      updatedMyHistory[existingIndex] = confirmedBet;
    } else {
      // Fallback: find any pending entry for this period (with duration match for K3)
      const fallbackIndex = updatedMyHistory.findIndex((h) => {
        const periodMatch = h.period === currentTradeId && h.result === null;
        if (gameName === "k3" && duration) {
          return periodMatch && (h.duration === duration || !h.duration);
        }
        return periodMatch;
      });
      
      if (fallbackIndex >= 0) {
        updatedMyHistory[fallbackIndex] = confirmedBet;
      } else {
        // Last resort: prepend as new entry (maintains history integrity)
        updatedMyHistory = [confirmedBet, ...updatedMyHistory];
      }
    }
  }

  // Save updated history ONCE after processing all bets
  if (hasBet) {
    saveMyHistory(gameName, gameType, updatedMyHistory);

    // Play result sound after short delay (once, based on overall outcome)
    setTimeout(() => {
      playResultSound(hasAnyWin, finalizedTradeId);
    }, 300);
  }

  // Build result data for modal
  if (hasBet) {
    // Sum up total bet amounts for display
    const totalBetAmount = betsThisRound.reduce((sum, b) => sum + b.totalStake, 0);
    
    resultData = {
      gameType,
      tradeId: finalizedTradeId,
      number: resultNumber,
      colors,
      bigSmall,
      hasBet: true,
      isWin: hasAnyWin,
      finalPayout: totalPayout,
      betAmount: totalBetAmount,
      ...(gameName === "k3" && { dice }),
    };
  } else {
    // No bet this round
    resultData = {
      gameType,
      tradeId: finalizedTradeId,
      number: resultNumber,
      colors,
      bigSmall,
      hasBet: false,
      ...(gameName === "k3" && { dice }),
    };
  }

  return {
    finalizedTradeId,
    resultNumber,
    colors,
    bigSmall,
    dice,
    oddEven,
    pattern,
    newHistoryItem,
    updatedHistory,
    updatedRecentResults,
    updatedMyHistory,
    resultData,
    hasBet,
    hasAnyWin,
    totalPayout,
    resolvedBetsCount,
    roundKey,
    duration,
  };
}
