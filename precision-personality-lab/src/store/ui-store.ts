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
}

// 🔧 local debounce reference (not part of Zustand state)
let connectionDebounce: NodeJS.Timeout | null = null;

export const useUIStore = create<UIState>((set, get) => ({
  toasts: [],
  isExportModalOpen: false,
  isRecalibrateModalOpen: false,
  exportFormat: 'json',
  isRealtimeConnected: false,
  lastSyncTime: null,

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
    }, 500); // 500ms debounce
  },

  updateLastSyncTime: () => set({ lastSyncTime: Date.now() }),
}));
