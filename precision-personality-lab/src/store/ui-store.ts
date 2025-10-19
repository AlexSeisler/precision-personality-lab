import { create } from 'zustand';
import type { Toast } from '@/types';

interface UIState {
  toasts: Toast[];
  isExportModalOpen: boolean;
  isRecalibrateModalOpen: boolean;
  exportFormat: 'csv' | 'json';

  addToast: (message: string, type?: Toast['type'], duration?: number) => void;
  removeToast: (id: string) => void;
  setExportModalOpen: (open: boolean) => void;
  setRecalibrateModalOpen: (open: boolean) => void;
  setExportFormat: (format: 'csv' | 'json') => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  toasts: [],
  isExportModalOpen: false,
  isRecalibrateModalOpen: false,
  exportFormat: 'json',

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

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),

  setExportModalOpen: (open) => set({ isExportModalOpen: open }),

  setRecalibrateModalOpen: (open) => set({ isRecalibrateModalOpen: open }),

  setExportFormat: (format) => set({ exportFormat: format }),
}));
