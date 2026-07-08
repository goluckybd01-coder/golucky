import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { toast } from "sonner";
import { generateTradeId } from "@/lib/tradeId";
import { generateGameHistory, generateRecentResults, loadMyHistory, saveMyHistory, saveGameHistory, type GameName, type BetHistoryItem } from "@/lib/gameStorage";
import { getCurrentPeriodNumber, generatePeriodHistory, type GameMode } from "@/lib/periodNumber";

// Per-mode state type
export interface ModeState {
  targetEnd: number;
  tradeId: string;
  history: any[];
  myHistory: BetHistoryItem[];
  recentResults: number[];
  currentDigits?: number[]; // For 5D game - stores last result digits per mode
}

// Game type definition
export interface GameType {
  id: string;
  label: string;
  sublabel: string;
  duration: number;
}

// Game emoji mapping for notifications
const GAME_EMOJIS: Record<GameName, string> = {
  k3: "🎲",
  fiveD: "🎯",
  trxWin: "⚡",
  winGo: "🎰",
};

// Game display names for notifications
const GAME_DISPLAY_NAMES: Record<GameName, string> = {
  k3: "K3",
  fiveD: "5D",
  trxWin: "TRX",
  winGo: "Win Go",
};

interface UseGameModeOptions {
  gameName: GameName;
  gameTypes: GameType[];
  initialGameType: string;
  // Optional custom history generator for games like K3 that have unique history structure
  customHistoryGenerator?: (gameType: string) => any[];
}

interface UseGameModeReturn {
  selectedGameType: string;
  setSelectedGameType: (type: string) => void;
  modeStates: Record<string, ModeState>;
  currentModeState: ModeState | undefined;
  currentTradeId: string;
  currentPeriodNumber: string;
  gameHistory: any[];
  recentResults: number[];
  myBetHistory: BetHistoryItem[];
  updateModeState: (modeId: string, updates: Partial<ModeState>) => void;
  addHistoryItem: (item: any) => void;
  addMyHistoryItem: (item: BetHistoryItem) => void;
  updateMyHistoryItem: (betId: string, updates: Partial<BetHistoryItem>) => void;
  updateRecentResults: (results: number[]) => void;
  startNewRound: () => void;
  tabTick: number;
  currentGame: GameType;
}

export function useGameMode({
  gameName,
  gameTypes,
  initialGameType,
  customHistoryGenerator,
}: UseGameModeOptions): UseGameModeReturn {
  const [selectedGameType, setSelectedGameType] = useState(initialGameType);
  const [tabTick, setTabTick] = useState(0);
  const notifiedModesRef = useRef<Set<string>>(new Set());

  // Initialize mode states for all game types
  const [modeStates, setModeStates] = useState<Record<string, ModeState>>(() => {
    const states: Record<string, ModeState> = {};
    gameTypes.forEach((game) => {
      const history = customHistoryGenerator 
        ? customHistoryGenerator(game.id)
        : generateGameHistory(gameName, game.id);
      states[game.id] = {
        targetEnd: Date.now() + game.duration * 1000,
        tradeId: generateTradeId(gameName, game.id),
        history,
        myHistory: loadMyHistory(gameName, game.id),
        recentResults: generateRecentResults(gameName, game.id),
      };
    });
    return states;
  });

  // Helper to update a specific mode's state
  const updateModeState = useCallback((modeId: string, updates: Partial<ModeState>) => {
    setModeStates(prev => ({
      ...prev,
      [modeId]: { ...prev[modeId], ...updates }
    }));
  }, []);

  // Current mode state derived values
  const currentModeState = modeStates[selectedGameType];
  const currentTradeId = currentModeState?.tradeId || "";
  // Period number - unique per game mode
  const currentPeriodNumber = useMemo(() => {
    return getCurrentPeriodNumber(gameName, selectedGameType as GameMode);
  }, [gameName, selectedGameType, tabTick]); // tabTick ensures update on each tick
  const gameHistory = currentModeState?.history || [];
  const recentResults = currentModeState?.recentResults || [];
  const myBetHistory = (currentModeState?.myHistory || []).map((item: any) => ({
    ...item,
    timestamp: item.timestamp instanceof Date ? item.timestamp : new Date(item.timestamp),
  }));

  // Current game config
  const currentGame = gameTypes.find((g) => g.id === selectedGameType) || gameTypes[0];

  // Add a history item to current mode
  const addHistoryItem = useCallback((item: any) => {
    const updatedHistory = [item, ...gameHistory.slice(0, 10)];
    saveGameHistory(gameName, selectedGameType, updatedHistory);
    updateModeState(selectedGameType, { history: updatedHistory });
  }, [gameName, selectedGameType, gameHistory, updateModeState]);

  // Add a my history item to current mode
  const addMyHistoryItem = useCallback((item: BetHistoryItem) => {
    setModeStates(prev => {
      const currentHistory = prev[selectedGameType]?.myHistory || [];
      const updatedMyHistory = [item, ...currentHistory];
      saveMyHistory(gameName, selectedGameType, updatedMyHistory);
      return {
        ...prev,
        [selectedGameType]: { ...prev[selectedGameType], myHistory: updatedMyHistory }
      };
    });
  }, [gameName, selectedGameType]);

  // Update a specific my history item (for settlement results)
  const updateMyHistoryItem = useCallback((betId: string, updates: Partial<BetHistoryItem>) => {
    setModeStates(prev => {
      const currentHistory = prev[selectedGameType]?.myHistory || [];
      const updatedMyHistory = currentHistory.map((item) => {
        if (item.betId === betId || item.period === betId) {
          return { ...item, ...updates };
        }
        return item;
      });
      saveMyHistory(gameName, selectedGameType, updatedMyHistory);
      return {
        ...prev,
        [selectedGameType]: { ...prev[selectedGameType], myHistory: updatedMyHistory }
      };
    });
  }, [gameName, selectedGameType]);

  // Update recent results
  const updateRecentResults = useCallback((results: number[]) => {
    updateModeState(selectedGameType, { recentResults: results });
  }, [selectedGameType, updateModeState]);

  // Start a new round for current mode
  const startNewRound = useCallback(() => {
    const nextTradeId = generateTradeId(gameName, selectedGameType);
    const nextTargetEnd = Date.now() + currentGame.duration * 1000;
    updateModeState(selectedGameType, {
      tradeId: nextTradeId,
      targetEnd: nextTargetEnd,
    });
  }, [gameName, selectedGameType, currentGame.duration, updateModeState]);

  // Tab tick interval for updating countdown displays + background notifications
  useEffect(() => {
    const interval = window.setInterval(() => {
      setTabTick(t => t + 1);
      
      // Check background modes for completed rounds
      const now = Date.now();
      gameTypes.forEach((game) => {
        if (game.id === selectedGameType) return; // Skip active tab
        
        const modeState = modeStates[game.id];
        if (!modeState) return;
        
        const remaining = Math.ceil((modeState.targetEnd - now) / 1000);
        const notifyKey = `${game.id}-${modeState.tradeId}`;
        
        if (remaining <= 0 && !notifiedModesRef.current.has(notifyKey)) {
          notifiedModesRef.current.add(notifyKey);
          const emoji = GAME_EMOJIS[gameName];
          const displayName = GAME_DISPLAY_NAMES[gameName];
          toast(`${emoji} ${displayName} ${game.sublabel} round completed!`, {
            description: "Switch tabs to see the result",
            duration: 4000,
          });
        }
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [selectedGameType, modeStates, gameTypes, gameName]);

  return {
    selectedGameType,
    setSelectedGameType,
    modeStates,
    currentModeState,
    currentTradeId,
    currentPeriodNumber,
    gameHistory,
    recentResults,
    myBetHistory,
    updateModeState,
    addHistoryItem,
    addMyHistoryItem,
    updateMyHistoryItem,
    updateRecentResults,
    startNewRound,
    tabTick,
    currentGame,
  };
}
