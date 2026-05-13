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

export interface Template {
  id: string;
  name: string;
  allocations: Allocation[];
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
  templates: Template[];
  history: FlowHistory[];
  savedAddresses: SavedAddress[];
  addRule: (rule: Omit<FlowRule, 'id' | 'createdAt'>) => void;
  updateRule: (id: string, rule: Partial<FlowRule>) => void;
  removeRule: (id: string) => void;
  addTemplate: (template: Omit<Template, 'id'>) => void;
  updateTemplate: (id: string, template: Partial<Template>) => void;
  removeTemplate: (id: string) => void;
  addToHistory: (entry: Omit<FlowHistory, 'id' | 'timestamp'>) => void;
  addAddress: (address: Omit<SavedAddress, 'id'>) => void;
  updateAddress: (id: string, address: Partial<SavedAddress>) => void;
  removeAddress: (id: string) => void;
}

const DEFAULT_TEMPLATES: Template[] = [
  { id: 't1', name: 'Equal Split', allocations: [{ label: 'Wallet 1', address: '', percentage: 50 }, { label: 'Wallet 2', address: '', percentage: 50 }] },
  { id: 't2', name: 'Golden Ratio', allocations: [{ label: 'Main', address: '', percentage: 62 }, { label: 'Side', address: '', percentage: 38 }] },
  { id: 't3', name: 'Tithes (10%)', allocations: [{ label: 'Main', address: '', percentage: 90 }, { label: 'Giving', address: '', percentage: 10 }] },
];

export const useFlowStore = create<FlowStore>()(
  persist(
    (set) => ({
      rules: [],
      templates: DEFAULT_TEMPLATES,
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
      updateRule: (id, rule) => set((state) => ({
        rules: state.rules.map((r) => r.id === id ? { ...r, ...rule } : r)
      })),
      removeRule: (id) => set((state) => ({
        rules: state.rules.filter((r) => r.id !== id)
      })),
      addTemplate: (template) => set((state) => ({
        templates: [
          ...state.templates,
          { ...template, id: Math.random().toString(36).substring(7) }
        ]
      })),
      updateTemplate: (id, template) => set((state) => ({
        templates: state.templates.map((t) => t.id === id ? { ...t, ...template } : t)
      })),
      removeTemplate: (id) => set((state) => ({
        templates: state.templates.filter((t) => t.id !== id)
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
      updateAddress: (id, address) => set((state) => ({
        savedAddresses: state.savedAddresses.map((a) => a.id === id ? { ...a, ...address } : a)
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
