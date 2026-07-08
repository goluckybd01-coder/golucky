import { create } from "zustand";

export type AgentTier = {
  id: number;
  name: string;
  bdt: number;
  commission: number;
};

type AgentState = {
  selectedTier: AgentTier | null;
  setTier: (tier: AgentTier | null) => void;
};

export const useAgentStore = create<AgentState>((set) => ({
  selectedTier: null,
  setTier: (tier) => set({ selectedTier: tier }),
}));
