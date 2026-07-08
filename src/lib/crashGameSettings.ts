// Crash Game configurable settings
// These can be adjusted by admin to control game pacing

export interface CrashGameSettings {
  // Timing settings (in seconds unless noted)
  betWindowSec: number;           // Duration of betting phase (default: 10)
  lockingSec: number;             // Duration of locking phase before flight (default: 2)
  postCrashSec: number;           // Duration to show crash result (default: 3)
  nextRoundGapSec: number;        // Gap before next round starts (default: 1.5)
  
  // Animation settings
  multiplierUpdateMs: number;     // How often to update multiplier display (default: 100ms)
  animationSpeedFactor: number;   // Speed factor for rocket (max 0.6, default: 0.6)
  minFlightDurationSec: number;   // Minimum visible flight time even for early crashes (default: 3)
  
  // Bet limits
  minBet: number;                 // Minimum bet amount (default: 10)
  maxBet: number;                 // Maximum bet amount (default: 50000)
  maxPayoutRound: number;         // Maximum payout per round (default: 500000)
  
  // UI settings
  showBetsCloseWarning: boolean;  // Show "Bets close at 2s" warning (default: true)
  betsCloseWarningSec: number;    // When to show warning (default: 2)
}

// Maximum animation speed factor (cannot exceed this)
export const MAX_ANIMATION_SPEED_FACTOR = 0.6;

export const defaultCrashGameSettings: CrashGameSettings = {
  // Phase durations
  betWindowSec: 10,        // EXACTLY 10 seconds for betting
  lockingSec: 2,           // 2 seconds locking phase
  postCrashSec: 3,         // 3 seconds to show crash result
  nextRoundGapSec: 1.5,    // 1.5 seconds before next round
  
  // Animation settings (capped at 0.6 for slower, smoother animation)
  multiplierUpdateMs: 100, // Update display every 100ms for smooth visuals
  animationSpeedFactor: 0.6, // Capped at 0.6 (40% slower rocket animation)
  minFlightDurationSec: 3, // Minimum 3 seconds visible flight even for early crashes
  
  // Bet limits (in ৳)
  minBet: 10,
  maxBet: 50000,
  maxPayoutRound: 500000,
  
  // UI hints
  showBetsCloseWarning: true,
  betsCloseWarningSec: 2,  // Show warning at 2 seconds remaining
};

// Load settings from localStorage (for admin overrides)
export function loadCrashGameSettings(): CrashGameSettings {
  try {
    const saved = localStorage.getItem("crash_game_settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      // Enforce max animation speed factor
      if (parsed.animationSpeedFactor && parsed.animationSpeedFactor > MAX_ANIMATION_SPEED_FACTOR) {
        parsed.animationSpeedFactor = MAX_ANIMATION_SPEED_FACTOR;
      }
      return { ...defaultCrashGameSettings, ...parsed };
    }
  } catch (e) {
    console.error("Failed to load crash game settings:", e);
  }
  return defaultCrashGameSettings;
}

// Save settings to localStorage
export function saveCrashGameSettings(settings: CrashGameSettings): void {
  try {
    // Enforce max animation speed factor before saving
    const sanitizedSettings = {
      ...settings,
      animationSpeedFactor: Math.min(settings.animationSpeedFactor, MAX_ANIMATION_SPEED_FACTOR),
    };
    localStorage.setItem("crash_game_settings", JSON.stringify(sanitizedSettings));
  } catch (e) {
    console.error("Failed to save crash game settings:", e);
  }
}

// Calculate the growth rate based on settings
// This ensures the rocket flight feels appropriately paced
export function calculateGrowthRate(
  elapsedMs: number, 
  settings: CrashGameSettings
): number {
  // Enforce speed cap
  const speedFactor = Math.min(settings.animationSpeedFactor, MAX_ANIMATION_SPEED_FACTOR);
  
  // Base growth rate adjusted by animation speed factor
  // Lower factor = slower growth
  const baseRate = 0.0008 * speedFactor;
  
  // Ease-in curve: start slower, then speed up
  // Takes about 3 seconds to reach full speed
  const easeInDuration = 3000;
  const easeInFactor = Math.min(1, elapsedMs / easeInDuration);
  
  // Start at 40% of base rate, ramp up to 100%
  const minFactor = 0.4;
  const easedRate = baseRate * (minFactor + (1 - minFactor) * easeInFactor);
  
  return easedRate;
}

// Calculate multiplier at a given time
export function calculateMultiplierAtTime(
  elapsedMs: number,
  settings: CrashGameSettings
): number {
  // Enforce speed cap
  const speedFactor = Math.min(settings.animationSpeedFactor, MAX_ANIMATION_SPEED_FACTOR);
  
  // Exponential growth with speed adjustment
  // Lower speed factor = slower growth
  const growthBase = 1 + (0.0005 * speedFactor);
  const multiplier = Math.pow(growthBase, elapsedMs);
  
  return Math.max(1.00, Number(multiplier.toFixed(2)));
}

// Estimate time to reach a target multiplier (for minimum flight duration)
export function estimateTimeToMultiplier(
  targetMultiplier: number,
  settings: CrashGameSettings
): number {
  // Enforce speed cap
  const speedFactor = Math.min(settings.animationSpeedFactor, MAX_ANIMATION_SPEED_FACTOR);
  const growthBase = 1 + (0.0005 * speedFactor);
  
  // Solve: targetMultiplier = growthBase^time
  // time = log(targetMultiplier) / log(growthBase)
  const timeMs = Math.log(targetMultiplier) / Math.log(growthBase);
  
  return timeMs;
}
