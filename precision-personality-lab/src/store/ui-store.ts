import { create } from 'zustand';
import type { Toast } from '@/types';

interface UIState {
  toasts: Toast[];
  isExportModalOpen: boolean;
  isRecalibrateModalOpen: boolean;
  exportFormat: 'csv' | 'json';
  isRealtimeConnected: boolean;
  lastSyncTime: number | null;

  addToast: (message: string, type?: Toast['type'], duration?: number) => void;
  removeToast: (id: string) => void;
  setExportModalOpen: (open: boolean) => void;
  setRecalibrateModalOpen: (open: boolean) => void;
  setExportFormat: (format: 'csv' | 'json') => void;
  setRealtimeConnected: (connected: boolean) => void;
  updateLastSyncTime: () => void;

  // ✅ Added reset method
  reset: () => void;
}

// 🔧 local debounce reference (not part of Zustand state)
let connectionDebounce: NodeJS.Timeout | null = null;

// ✅ Initial state extracted for reuse in reset()
const initialState = {
  toasts: [] as Toast[],
  isExportModalOpen: false,
  isRecalibrateModalOpen: false,
  exportFormat: 'json' as 'csv' | 'json',
  isRealtimeConnected: false,
  lastSyncTime: null as number | null,
};

export const useUIStore = create<UIState>((set, get) => ({
  ...initialState,

  addToast: (message, type = 'info', duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast: Toast = { id, message, type, duration };

    set((state) => ({ toasts: [...state.toasts, toast] }));

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  setExportModalOpen: (open) => set({ isExportModalOpen: open }),
  setRecalibrateModalOpen: (open) => set({ isRecalibrateModalOpen: open }),
  setExportFormat: (format) => set({ exportFormat: format }),

  // ✅ Debounced connection state update
  setRealtimeConnected: (connected) => {
    if (connectionDebounce) clearTimeout(connectionDebounce);
    connectionDebounce = setTimeout(() => {
      const current = get().isRealtimeConnected;
      if (current !== connected) {
        set({ isRealtimeConnected: connected });
      }
    }, 500);
  },

  updateLastSyncTime: () => set({ lastSyncTime: Date.now() }),

  // ✅ Reset implementation — restores all fields to initial defaults
  reset: () => set({ ...initialState }),
}));
