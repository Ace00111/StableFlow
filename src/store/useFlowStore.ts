import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Allocation {
  label: string;
  address: string;
  percentage: number;
}

export interface FlowRule {
  id: string;
  name: string;
  allocations: Allocation[];
  createdAt: number;
}

export interface FlowHistory {
  id: string;
  amount: string;
  ruleName: string;
  txHash: string;
  timestamp: number;
  allocations: Allocation[];
}

interface FlowStore {
  rules: FlowRule[];
  history: FlowHistory[];
  addRule: (rule: Omit<FlowRule, 'id' | 'createdAt'>) => void;
  removeRule: (id: string) => void;
  addToHistory: (entry: Omit<FlowHistory, 'id' | 'timestamp'>) => void;
}

export const useFlowStore = create<FlowStore>()(
  persist(
    (set) => ({
      rules: [],
      history: [],
      addRule: (rule) => set((state) => ({
        rules: [
          ...state.rules,
          { 
            ...rule, 
            id: Math.random().toString(36).substring(7), 
            createdAt: Date.now() 
          }
        ]
      })),
      removeRule: (id) => set((state) => ({
        rules: state.rules.filter((r) => r.id !== id)
      })),
      addToHistory: (entry) => set((state) => ({
        history: [
          { 
            ...entry, 
            id: Math.random().toString(36).substring(7), 
            timestamp: Date.now() 
          },
          ...state.history
        ].slice(0, 50) // Keep last 50
      })),
    }),
    {
      name: 'stable-flow-storage',
    }
  )
);
