import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { logAuditEvent } from '@/lib/api/audit';
import type { LLMResponse } from '@/types';

interface ExtendedMetricsSummary {
  avgCreativity: number;
  avgCoherence: number;
  avgStructure: number;
  avgCompleteness: number;
  avgLatency: number;
  avgResponseLength: number;
  avgConsistency: number;
  totalExperiments: number;
  lastUpdated: number;
}

interface MetricsState {
  summary: ExtendedMetricsSummary | null;
  isLoading: boolean;
  lastSynced: number | null;

  computeSummary: (responses: LLMResponse[], calibrationId?: string) => Promise<void>;
  loadCachedSummary: (calibrationId: string) => Promise<void>;
  setSummary: (summary: ExtendedMetricsSummary) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialSummary: ExtendedMetricsSummary = {
  avgCreativity: 0,
  avgCoherence: 0,
  avgStructure: 0,
  avgCompleteness: 0,
  avgLatency: 0,
  avgResponseLength: 0,
  avgConsistency: 0,
  totalExperiments: 0,
  lastUpdated: Date.now(),
};

export const useMetricsStore = create<MetricsState>((set, get) => ({
  summary: null,
  isLoading: false,
  lastSynced: null,

  computeSummary: async (responses: LLMResponse[], calibrationId?: string) => {
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

    const avgLatency = responses.reduce((acc, r) => {
      const latency = r.timestamp ? Date.now() - r.timestamp : 0;
      return acc + latency;
    }, 0) / responses.length;

    const avgResponseLength = responses.reduce((acc, r) => acc + r.text.length, 0) / responses.length;

    const avgConsistency = responses.reduce((acc, r) => {
      const metricValues = [
        r.metrics.creativity,
        r.metrics.coherence,
        r.metrics.structure,
        r.metrics.completeness,
      ];
      const mean = metricValues.reduce((a, b) => a + b, 0) / metricValues.length;
      const variance = metricValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / metricValues.length;
      const consistency = 1 - Math.sqrt(variance) / 100;
      return acc + Math.max(0, Math.min(1, consistency));
    }, 0) / responses.length;

    const summary: ExtendedMetricsSummary = {
      avgCreativity,
      avgCoherence,
      avgStructure,
      avgCompleteness,
      avgLatency,
      avgResponseLength,
      avgConsistency,
      totalExperiments: responses.length,
      lastUpdated: Date.now(),
    };

    set({ summary, lastSynced: Date.now() });

    if (calibrationId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('analytics_summaries').upsert({
            user_id: user.id,
            calibration_id: calibrationId,
            metrics_summary: summary,
          });
          await logAuditEvent('analytics_computed', {
            calibration_id: calibrationId,
            total_experiments: responses.length
          });
        }
      } catch (error) {
        console.error('Failed to cache analytics summary:', error);
      }
    }
  },

  loadCachedSummary: async (calibrationId: string) => {
    try {
      set({ isLoading: true });
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        set({ isLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from('analytics_summaries')
        .select('*')
        .eq('user_id', user.id)
        .eq('calibration_id', calibrationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const summary = data.metrics_summary as ExtendedMetricsSummary;
        set({ summary, lastSynced: Date.now(), isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load cached summary:', error);
      set({ isLoading: false });
    }
  },

  setSummary: (summary: ExtendedMetricsSummary) => {
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
