import { create } from 'zustand';
import type { LLMResponse } from '@/types';

interface MetricsSummary {
  avgCreativity: number;
  avgCoherence: number;
  avgStructure: number;
  avgCompleteness: number;
  totalExperiments: number;
  lastUpdated: number;
}

interface MetricsState {
  summary: MetricsSummary | null;
  isLoading: boolean;
  lastSynced: number | null;

  computeSummary: (responses: LLMResponse[]) => void;
  setSummary: (summary: MetricsSummary) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialSummary: MetricsSummary = {
  avgCreativity: 0,
  avgCoherence: 0,
  avgStructure: 0,
  avgCompleteness: 0,
  totalExperiments: 0,
  lastUpdated: Date.now(),
};

export const useMetricsStore = create<MetricsState>((set) => ({
  summary: null,
  isLoading: false,
  lastSynced: null,

  computeSummary: (responses: LLMResponse[]) => {
    if (responses.length === 0) {
      set({ summary: initialSummary, lastSynced: Date.now() });
      return;
    }

    const avgCreativity =
      responses.reduce((acc, r) => acc + r.metrics.creativity, 0) / responses.length;
    const avgCoherence =
      responses.reduce((acc, r) => acc + r.metrics.coherence, 0) / responses.length;
    const avgStructure =
      responses.reduce((acc, r) => acc + r.metrics.structure, 0) / responses.length;
    const avgCompleteness =
      responses.reduce((acc, r) => acc + r.metrics.completeness, 0) / responses.length;

    set({
      summary: {
        avgCreativity,
        avgCoherence,
        avgStructure,
        avgCompleteness,
        totalExperiments: responses.length,
        lastUpdated: Date.now(),
      },
      lastSynced: Date.now(),
    });
  },

  setSummary: (summary: MetricsSummary) => {
    set({ summary, lastSynced: Date.now() });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  reset: () => {
    set({
      summary: null,
      isLoading: false,
      lastSynced: null,
    });
  },
}));
