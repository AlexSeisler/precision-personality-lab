import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CalibrationAnswer, ParameterRange } from '@/types';

interface CalibrationState {
  answers: CalibrationAnswer[];
  parameterRanges: ParameterRange | null;
  isCalibrated: boolean;
  calibrationMode: 'quick' | 'deep';
  currentQuestionIndex: number;

  setAnswer: (answer: CalibrationAnswer) => void;
  setParameterRanges: (ranges: ParameterRange) => void;
  setCalibrated: (calibrated: boolean) => void;
  setCalibrationMode: (mode: 'quick' | 'deep') => void;
  setCurrentQuestionIndex: (index: number) => void;
  resetCalibration: () => void;
  getAnswerByQuestionId: (questionId: string) => CalibrationAnswer | undefined;
}

const defaultParameterRanges: ParameterRange = {
  temperature: { min: 0.5, max: 0.9 },
  topP: { min: 0.7, max: 1.0 },
  maxTokens: { min: 500, max: 2000 },
  frequencyPenalty: { min: 0.0, max: 0.5 },
};

export const useCalibrationStore = create<CalibrationState>()(
  persist(
    (set, get) => ({
      answers: [],
      parameterRanges: null,
      isCalibrated: false,
      calibrationMode: 'quick',
      currentQuestionIndex: 0,

      setAnswer: (answer) => {
        const existingIndex = get().answers.findIndex(
          (a) => a.questionId === answer.questionId
        );

        if (existingIndex >= 0) {
          const newAnswers = [...get().answers];
          newAnswers[existingIndex] = answer;
          set({ answers: newAnswers });
        } else {
          set({ answers: [...get().answers, answer] });
        }
      },

      setParameterRanges: (ranges) => set({ parameterRanges: ranges }),

      setCalibrated: (calibrated) => set({ isCalibrated: calibrated }),

      setCalibrationMode: (mode) => set({ calibrationMode: mode }),

      setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),

      resetCalibration: () => set({
        answers: [],
        parameterRanges: defaultParameterRanges,
        isCalibrated: false,
        currentQuestionIndex: 0,
      }),

      getAnswerByQuestionId: (questionId) => {
        return get().answers.find((a) => a.questionId === questionId);
      },
    }),
    {
      name: 'calibration-storage',
    }
  )
);
