// React hook for the deterministic gameStore
import { useSyncExternalStore } from "react";
import { gameStore, type GameStoreState } from "@/lib/gameStore";
import type { GameName } from "@/lib/gameStorage";

/**
 * React hook to subscribe to game store state changes
 * Uses useSyncExternalStore for concurrent-safe subscriptions
 */
export const useGameStore = (gameName: GameName, gameType: string): GameStoreState => {
  return useSyncExternalStore(
    (listener) => gameStore.subscribe(gameName, gameType, listener),
    () => gameStore.getSnapshot(gameName, gameType),
    () => gameStore.getSnapshot(gameName, gameType)
  );
};

// Note: gameStore should be imported from @/lib/gameStore directly
