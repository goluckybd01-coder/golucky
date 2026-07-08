/**
 * Haptic feedback utilities for mobile devices
 * Uses the Web Vibration API (supported on Android and some iOS browsers)
 */

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'milestone' | 'cashout' | 'streak';

// Vibration patterns in milliseconds [vibrate, pause, vibrate, pause, ...]
const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [30, 50, 30],
  warning: [50, 30, 50],
  error: [100, 50, 100, 50, 100],
  milestone: [50, 30, 50, 30, 100, 50, 150], // Celebratory burst
  cashout: [20, 20, 40, 20, 60], // Quick escalating tap
  streak: [30, 20, 30, 20, 50, 30, 80], // Building excitement
};

/**
 * Check if haptic feedback is supported
 */
export function isHapticSupported(): boolean {
  return 'vibrate' in navigator;
}

/**
 * Trigger haptic feedback with a predefined pattern
 */
export function haptic(pattern: HapticPattern = 'medium'): boolean {
  if (!isHapticSupported()) {
    return false;
  }
  
  try {
    const vibrationPattern = HAPTIC_PATTERNS[pattern];
    navigator.vibrate(vibrationPattern);
    return true;
  } catch (error) {
    console.warn('Haptic feedback failed:', error);
    return false;
  }
}

/**
 * Trigger a custom vibration pattern
 */
export function hapticCustom(pattern: number | number[]): boolean {
  if (!isHapticSupported()) {
    return false;
  }
  
  try {
    navigator.vibrate(pattern);
    return true;
  } catch (error) {
    console.warn('Haptic feedback failed:', error);
    return false;
  }
}

/**
 * Stop any ongoing vibration
 */
export function hapticStop(): void {
  if (isHapticSupported()) {
    navigator.vibrate(0);
  }
}

/**
 * Haptic feedback for different multiplier ranges
 */
export function hapticForMultiplier(multiplier: number): void {
  if (multiplier >= 10) {
    haptic('milestone');
  } else if (multiplier >= 5) {
    haptic('heavy');
  } else if (multiplier >= 3) {
    haptic('medium');
  } else if (multiplier >= 2) {
    haptic('light');
  } else {
    haptic('light');
  }
}

/**
 * Haptic feedback for streak tiers
 */
export function hapticForStreak(streak: number): void {
  if (streak >= 15) {
    // Godlike - intense celebration
    hapticCustom([100, 50, 100, 50, 150, 50, 200]);
  } else if (streak >= 10) {
    // Legendary
    hapticCustom([80, 40, 80, 40, 120, 50, 150]);
  } else if (streak >= 7) {
    // Unstoppable
    hapticCustom([60, 30, 60, 30, 100]);
  } else if (streak >= 5) {
    // Blazing
    hapticCustom([50, 30, 50, 30, 80]);
  } else if (streak >= 3) {
    // On Fire
    hapticCustom([40, 25, 40, 25, 60]);
  } else if (streak >= 2) {
    // Hot
    haptic('success');
  }
}
