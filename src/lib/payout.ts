/**
 * Payout calculation utility for all games
 * Applies a fixed 2% service fee on all winning payouts
 */

import { formatTaka } from "@/lib/currency";

const SERVICE_FEE_RATE = 0.02; // 2% service fee

/**
 * Calculate the final payout after applying 2% service fee
 * @param betAmount - The original bet amount
 * @param odds - The multiplier/odds for the bet
 * @returns The final payout after 2% service fee deduction
 * 
 * Examples:
 * - Bet 100,000, odds 2x → gross 200,000 → final 196,000
 * - Bet 1,000, odds 9x → gross 9,000 → final 8,820
 */
export const calculatePayout = (betAmount: number, odds: number): number => {
  const grossWin = betAmount * odds;
  const serviceFee = grossWin * SERVICE_FEE_RATE;
  const finalPayout = grossWin - serviceFee;
  return Math.floor(finalPayout * 100) / 100; // Round to 2 decimal places
};

/**
 * Format payout amount for display - uses centralized currency utility
 * @param amount - The payout amount (already net after 2% fee)
 * @returns Formatted string with ৳ symbol
 */
export const formatPayout = (amount: number): string => {
  return formatTaka(amount);
};

/**
 * Get the service fee amount for a winning bet
 * @param betAmount - The original bet amount
 * @param odds - The multiplier/odds for the bet
 * @returns The service fee amount (2% of gross win)
 */
export const getServiceFee = (betAmount: number, odds: number): number => {
  const grossWin = betAmount * odds;
  return Math.floor(grossWin * SERVICE_FEE_RATE * 100) / 100;
};

/**
 * Game odds configuration
 * Used for calculating payouts across all games
 */
export const GAME_ODDS = {
  // Win Go odds
  winGo: {
    number: 8,      // Specific number match: 8x (then 2% tax)
    color: 2,       // Green/Red: 2x
    violet: 2,      // Violet: 2x (same as Big/Small)
    bigSmall: 2,    // Big/Small: 2x
  },
  // K3 (Dice) odds
  k3: {
    bigSmall: 2,    // Big/Small: 2x
    oddEven: 2,     // Odd/Even: 2x
    singleDice: 6,  // Single dice match: 6x
    tripleDice: 180,// Triple (same number on all 3): 180x
  },
  // 5D odds
  fiveD: {
    bigSmall: 2,    // Big/Small: 2x
    oddEven: 2,     // Odd/Even: 2x
    exactNumber: 9, // Exact number in position: 9x
  },
  // TRX Win odds
  trxWin: {
    number: 9,      // Specific number: 9x
    green: 2,       // Green: 2x
    red: 2,         // Red: 2x
    violet: 4.5,    // Violet: 4.5x
  },
};
