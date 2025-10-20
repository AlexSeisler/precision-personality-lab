import { create } from 'zustand';
import type { Database } from '@/lib/supabase/types';

type ExperimentRow = Database['public']['Tables']['experiments']['Row'];

interface DashboardFilters {
  calibrationId?: string;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
}

interface DashboardState {
  experiments: ExperimentRow[];
  filteredExperiments: ExperimentRow[];
  filters: DashboardFilters;
  isLoading: boolean;
  selectedExperiment: ExperimentRow | null;

  setExperiments: (experiments: ExperimentRow[]) => void;
  addExperiment: (experiment: ExperimentRow) => void;
  removeExperiment: (id: string) => void;
  updateExperiment: (id: string, updates: Partial<ExperimentRow>) => void;
  setFilters: (filters: Partial<DashboardFilters>) => void;
  setSelectedExperiment: (experiment: ExperimentRow | null) => void;
  setLoading: (loading: boolean) => void;
  applyFilters: () => void;
  reset: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  experiments: [],
  filteredExperiments: [],
  filters: {},
  isLoading: false,
  selectedExperiment: null,

  setExperiments: (experiments) => {
    set({ experiments, filteredExperiments: experiments });
    get().applyFilters();
  },

  addExperiment: (experiment) => {
    set((state) => ({
      experiments: [experiment, ...state.experiments],
    }));
    get().applyFilters();
  },

  removeExperiment: (id) => {
    set((state) => ({
      experiments: state.experiments.filter((e) => e.id !== id),
      selectedExperiment:
        state.selectedExperiment?.id === id ? null : state.selectedExperiment,
    }));
    get().applyFilters();
  },

  updateExperiment: (id, updates) => {
    set((state) => ({
      experiments: state.experiments.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    }));
    get().applyFilters();
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
    get().applyFilters();
  },

  setSelectedExperiment: (experiment) => {
    set({ selectedExperiment: experiment });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  applyFilters: () => {
    const { experiments, filters } = get();
    let filtered = experiments.filter((e) => !e.discarded);

    if (filters.calibrationId) {
      filtered = filtered.filter(
        (e) => e.calibration_id === filters.calibrationId
      );
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(
        (e) => new Date(e.created_at) >= fromDate
      );
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      filtered = filtered.filter((e) => new Date(e.created_at) <= toDate);
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.prompt.toLowerCase().includes(term) ||
          JSON.stringify(e.parameters).toLowerCase().includes(term)
      );
    }

    set({ filteredExperiments: filtered });
  },

  reset: () => {
    set({
      experiments: [],
      filteredExperiments: [],
      filters: {},
      isLoading: false,
      selectedExperiment: null,
    });
  },
}));
