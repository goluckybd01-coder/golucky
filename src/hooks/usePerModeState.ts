import { useState, useCallback, useRef, useEffect } from "react";
import { generateTradeId } from "@/lib/tradeId";
import { generateGameHistory, loadMyHistory, saveMyHistory, type BetHistoryItem, type GameName } from "@/lib/gameStorage";

export interface ModeState {
  targetEnd: number;
  tradeId: string;
  history: any[];
  myHistory: BetHistoryItem[];
  recentResults: number[];
}

export interface GameType {
  id: string;
  label: string;
  sublabel: string;
  duration: number;
}

export const usePerModeState = (gameName: GameName, gameTypes: GameType[]) => {
  // Initialize per-mode state for all game types
  const [modeStates, setModeStates] = useState<Record<string, ModeState>>(() => {
    const states: Record<string, ModeState> = {};
    gameTypes.forEach((game) => {
      const history = generateGameHistory(gameName, game.id);
      states[game.id] = {
        targetEnd: Date.now() + game.duration * 1000,
        tradeId: generateTradeId(gameName, game.id),
        history,
        myHistory: loadMyHistory(gameName, game.id),
        recentResults: history.slice(0, 5).map((h: any) => h.number ?? h.sum ?? 0),
      };
    });
    return states;
  });

  // Helper to update a specific mode's state
  const updateModeState = useCallback((modeId: string, updates: Partial<ModeState>) => {
    setModeStates(prev => ({
      ...prev,
      [modeId]: { ...prev[modeId], ...updates },
    }));
  }, []);

  // Get current mode state
  const getModeState = useCallback((modeId: string): ModeState | undefined => {
    return modeStates[modeId];
  }, [modeStates]);

  // Update history for a specific mode
  const addHistoryItem = useCallback((modeId: string, newItem: any, maxItems: number = 10) => {
    setModeStates(prev => {
      const mode = prev[modeId];
      if (!mode) return prev;
      return {
        ...prev,
        [modeId]: {
          ...mode,
          history: [newItem, ...mode.history.slice(0, maxItems - 1)],
        },
      };
    });
  }, []);

  // Update my history for a specific mode
  const addMyHistoryItem = useCallback((modeId: string, newItem: BetHistoryItem) => {
    setModeStates(prev => {
      const mode = prev[modeId];
      if (!mode) return prev;
      const updatedHistory = [newItem, ...mode.myHistory];
      saveMyHistory(gameName, modeId, updatedHistory);
      return {
        ...prev,
        [modeId]: {
          ...mode,
          myHistory: updatedHistory,
        },
      };
    });
  }, [gameName]);

  // Update recent results
  const addRecentResult = useCallback((modeId: string, newResult: number, maxResults: number = 5) => {
    setModeStates(prev => {
      const mode = prev[modeId];
      if (!mode) return prev;
      return {
        ...prev,
        [modeId]: {
          ...mode,
          recentResults: [newResult, ...mode.recentResults.slice(0, maxResults - 1)],
        },
      };
    });
  }, []);

  // Start new round for a specific mode
  const startNewRound = useCallback((modeId: string, duration: number) => {
    const nextTradeId = generateTradeId(gameName, modeId);
    setModeStates(prev => ({
      ...prev,
      [modeId]: {
        ...prev[modeId],
        targetEnd: Date.now() + duration * 1000,
        tradeId: nextTradeId,
      },
    }));
    return nextTradeId;
  }, [gameName]);

  return {
    modeStates,
    updateModeState,
    getModeState,
    addHistoryItem,
    addMyHistoryItem,
    addRecentResult,
    startNewRound,
  };
};
