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

export interface SavedAddress {
  id: string;
  label: string;
  address: string;
}

interface FlowStore {
  rules: FlowRule[];
  history: FlowHistory[];
  savedAddresses: SavedAddress[];
  addRule: (rule: Omit<FlowRule, 'id' | 'createdAt'>) => void;
  removeRule: (id: string) => void;
  addToHistory: (entry: Omit<FlowHistory, 'id' | 'timestamp'>) => void;
  addAddress: (address: Omit<SavedAddress, 'id'>) => void;
  removeAddress: (id: string) => void;
}

export const useFlowStore = create<FlowStore>()(
  persist(
    (set) => ({
      history: [],
      savedAddresses: [],
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
      addAddress: (address) => set((state) => ({
        savedAddresses: [
          ...state.savedAddresses,
          { 
            ...address, 
            id: Math.random().toString(36).substring(7) 
          }
        ]
      })),
      removeAddress: (id) => set((state) => ({
        savedAddresses: state.savedAddresses.filter((a) => a.id !== id)
      })),
    }),
    {
      name: 'stable-flow-storage',
    }
  )
);
