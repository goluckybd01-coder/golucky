import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';

export type GameType = 'wingo' | 'k3' | '5d' | 'trxwin';

export interface GameMode {
  id: string;
  label: string;
  duration: number; // seconds
}

export const WINGO_MODES: GameMode[] = [
  { id: "30sec", label: "30 Sec", duration: 30 },
  { id: "1min", label: "1 Min", duration: 60 },
  { id: "3min", label: "3 Min", duration: 180 },
  { id: "5min", label: "5 Min", duration: 300 },
];

export const K3_MODES: GameMode[] = [
  { id: "1min", label: "1 Min", duration: 60 },
  { id: "3min", label: "3 Min", duration: 180 },
  { id: "5min", label: "5 Min", duration: 300 },
  { id: "10min", label: "10 Min", duration: 600 },
];

export const FIVED_MODES: GameMode[] = [
  { id: "1min", label: "1 Min", duration: 60 },
  { id: "3min", label: "3 Min", duration: 180 },
  { id: "5min", label: "5 Min", duration: 300 },
  { id: "10min", label: "10 Min", duration: 600 },
];

export const TRXWIN_MODES: GameMode[] = [
  { id: "30sec", label: "30 Sec", duration: 30 },
  { id: "1min", label: "1 Min", duration: 60 },
  { id: "3min", label: "3 Min", duration: 180 },
  { id: "5min", label: "5 Min", duration: 300 },
];

export const getModesForGame = (gameType: GameType): GameMode[] => {
  switch (gameType) {
    case 'wingo': return WINGO_MODES;
    case 'k3': return K3_MODES;
    case '5d': return FIVED_MODES;
    case 'trxwin': return TRXWIN_MODES;
    default: return WINGO_MODES;
  }
};

// Mode code for Trade ID generation (matches game engines)
const getModeCode = (modeId: string): string => {
  switch (modeId) {
    case "30sec": return "A";
    case "1min": return "B";
    case "3min": return "C";
    case "5min": return "D";
    case "10min": return "E";
    default: return "B";
  }
};

interface TimerState {
  countdowns: Record<string, number>;
  currentTradeId: string;
  currentPeriodNumber: string;
  roundStartTime: number;
  roundEndTime: number;
  progress: number; // 0-100 percentage of round elapsed
  isLocked: boolean; // Last 5 seconds - betting locked
  phase: 'betting' | 'locked' | 'revealing';
}

/**
 * Centralized admin game timer hook with 100% accurate time sync
 * Uses the same calculation logic as the actual game engines
 */
export const useAdminGameTimer = (gameType: GameType, activeMode: string) => {
  const modes = getModesForGame(gameType);
  const [state, setState] = useState<TimerState>({
    countdowns: {},
    currentTradeId: '',
    currentPeriodNumber: '',
    roundStartTime: 0,
    roundEndTime: 0,
    progress: 0,
    isLocked: false,
    phase: 'betting',
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Calculate remaining seconds for a specific duration
   * CRITICAL: Uses same logic as game engines for 100% accuracy
   */
  const calculateCountdown = useCallback((durationSeconds: number): number => {
    const now = Date.now();
    const durationMs = durationSeconds * 1000;
    const roundStart = Math.floor(now / durationMs) * durationMs;
    const roundEnd = roundStart + durationMs;
    return Math.max(0, Math.ceil((roundEnd - now) / 1000));
  }, []);

  /**
   * Get the round start timestamp for a specific duration
   */
  const getRoundStartTime = useCallback((durationSeconds: number): number => {
    const now = Date.now();
    const durationMs = durationSeconds * 1000;
    return Math.floor(now / durationMs) * durationMs;
  }, []);

  /**
   * Generate Trade ID matching game engine format
   * Format: YYYYMMDDHHmmss + ModeCode + Serial
   */
  const generateTradeId = useCallback((modeId: string, durationSeconds: number): string => {
    const now = new Date();
    const roundStart = getRoundStartTime(durationSeconds);
    const roundDate = new Date(roundStart);
    
    const year = roundDate.getFullYear();
    const month = String(roundDate.getMonth() + 1).padStart(2, '0');
    const day = String(roundDate.getDate()).padStart(2, '0');
    const hours = String(roundDate.getHours()).padStart(2, '0');
    const mins = String(roundDate.getMinutes()).padStart(2, '0');
    const secs = String(roundDate.getSeconds()).padStart(2, '0');
    
    const modeCode = getModeCode(modeId);
    
    // For shorter format (used in admin display)
    const dayStart = new Date(year, roundDate.getMonth(), roundDate.getDate()).getTime();
    const durationMs = durationSeconds * 1000;
    const dailySerial = Math.floor((roundStart - dayStart) / durationMs) + 1;
    
    // Full format: YYYYMMDDHHmmss + ModeCode + Serial
    return `${year}${month}${day}${hours}${mins}${secs}${modeCode}${String(dailySerial).padStart(3, '0')}`;
  }, [getRoundStartTime]);

  /**
   * Generate Period Number for display
   * Format: YYYYMMDD + 5-digit serial
   */
  const generatePeriodNumber = useCallback((modeId: string, durationSeconds: number): string => {
    const roundStart = getRoundStartTime(durationSeconds);
    const roundDate = new Date(roundStart);
    
    const year = roundDate.getFullYear();
    const month = String(roundDate.getMonth() + 1).padStart(2, '0');
    const day = String(roundDate.getDate()).padStart(2, '0');
    
    const dayStart = new Date(year, roundDate.getMonth(), roundDate.getDate()).getTime();
    const durationMs = durationSeconds * 1000;
    const dailySerial = Math.floor((roundStart - dayStart) / durationMs) + 1;
    
    // Game-specific format
    if (gameType === '5d') {
      const modeCode = { 60: 'A', 180: 'B', 300: 'C', 600: 'D' }[durationSeconds] || 'A';
      return `5D-${year}${month}${day}-${modeCode}-${String(dailySerial).padStart(4, '0')}`;
    }
    
    return `${year}${month}${day}${String(dailySerial).padStart(5, '0')}`;
  }, [getRoundStartTime, gameType]);

  /**
   * Main timer update function - runs every 100ms for smooth updates
   */
  const updateTimer = useCallback(() => {
    const newCountdowns: Record<string, number> = {};
    
    modes.forEach(mode => {
      newCountdowns[mode.id] = calculateCountdown(mode.duration);
    });

    const activeModeDef = modes.find(m => m.id === activeMode);
    const activeDuration = activeModeDef?.duration || 30;
    const remaining = newCountdowns[activeMode] || 0;
    const roundStart = getRoundStartTime(activeDuration);
    const roundEnd = roundStart + (activeDuration * 1000);
    const elapsed = activeDuration - remaining;
    const progress = (elapsed / activeDuration) * 100;

    let phase: 'betting' | 'locked' | 'revealing' = 'betting';
    if (remaining <= 0) {
      phase = 'revealing';
    } else if (remaining <= 5) {
      phase = 'locked';
    }

    setState({
      countdowns: newCountdowns,
      currentTradeId: generateTradeId(activeMode, activeDuration),
      currentPeriodNumber: generatePeriodNumber(activeMode, activeDuration),
      roundStartTime: roundStart,
      roundEndTime: roundEnd,
      progress,
      isLocked: remaining <= 5,
      phase,
    });
  }, [modes, activeMode, calculateCountdown, getRoundStartTime, generateTradeId, generatePeriodNumber]);

  // Start timer on mount and mode change
  useEffect(() => {
    updateTimer(); // Initial update
    
    // Use 100ms interval for smooth countdown
    intervalRef.current = setInterval(updateTimer, 100);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updateTimer]);

  // Format countdown for display (MM:SS or just SS)
  const formatCountdown = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `00:${String(secs).padStart(2, '0')}`;
  }, []);

  // Get countdown digits for animated display
  const getCountdownDigits = useCallback((seconds: number): { min1: number; min2: number; sec1: number; sec2: number } => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return {
      min1: Math.floor(mins / 10),
      min2: mins % 10,
      sec1: Math.floor(secs / 10),
      sec2: secs % 10,
    };
  }, []);

  return {
    ...state,
    modes,
    formatCountdown,
    getCountdownDigits,
    currentCountdown: state.countdowns[activeMode] || 0,
  };
};
