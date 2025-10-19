import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Experiment, ExperimentParameters, LLMResponse } from '@/types';

interface ExperimentState {
  currentPrompt: string;
  currentParameters: ExperimentParameters;
  currentResponses: LLMResponse[];
  experiments: Experiment[];
  isGenerating: boolean;
  selectedResponseIds: string[];

  setPrompt: (prompt: string) => void;
  setParameter: (key: keyof ExperimentParameters, value: number) => void;
  setParameters: (parameters: ExperimentParameters) => void;
  addResponse: (response: LLMResponse) => void;
  setResponses: (responses: LLMResponse[]) => void;
  setGenerating: (generating: boolean) => void;
  toggleResponseSelection: (id: string) => void;
  clearResponseSelection: () => void;
  saveExperiment: () => void;
  loadExperiment: (id: string) => void;
  deleteExperiment: (id: string) => void;
  reset: () => void;
}

const defaultParameters: ExperimentParameters = {
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 1000,
  frequencyPenalty: 0.0,
  presencePenalty: 0.0,
};

export const useExperimentStore = create<ExperimentState>()(
  persist(
    (set, get) => ({
      currentPrompt: '',
      currentParameters: defaultParameters,
      currentResponses: [],
      experiments: [],
      isGenerating: false,
      selectedResponseIds: [],

      setPrompt: (prompt) => set({ currentPrompt: prompt }),

      setParameter: (key, value) => set((state) => ({
        currentParameters: { ...state.currentParameters, [key]: value },
      })),

      setParameters: (parameters) => set({ currentParameters: parameters }),

      addResponse: (response) => set((state) => ({
        currentResponses: [...state.currentResponses, response],
      })),

      setResponses: (responses) => set({ currentResponses: responses }),

      setGenerating: (generating) => set({ isGenerating: generating }),

      toggleResponseSelection: (id) => set((state) => {
        const isSelected = state.selectedResponseIds.includes(id);
        return {
          selectedResponseIds: isSelected
            ? state.selectedResponseIds.filter((rid) => rid !== id)
            : [...state.selectedResponseIds, id],
        };
      }),

      clearResponseSelection: () => set({ selectedResponseIds: [] }),

      saveExperiment: () => {
        const state = get();
        const experiment: Experiment = {
          id: `exp-${Date.now()}`,
          prompt: state.currentPrompt,
          parameters: state.currentParameters,
          responses: state.currentResponses,
          timestamp: Date.now(),
        };
        set({ experiments: [...state.experiments, experiment] });
      },

      loadExperiment: (id) => {
        const experiment = get().experiments.find((e) => e.id === id);
        if (experiment) {
          set({
            currentPrompt: experiment.prompt,
            currentParameters: experiment.parameters,
            currentResponses: experiment.responses,
          });
        }
      },

      deleteExperiment: (id) => set((state) => ({
        experiments: state.experiments.filter((e) => e.id !== id),
      })),

      reset: () => set({
        currentPrompt: '',
        currentParameters: defaultParameters,
        currentResponses: [],
        isGenerating: false,
        selectedResponseIds: [],
      }),
    }),
    {
      name: 'experiment-storage',
    }
  )
);
