export interface CalibrationAnswer {
  questionId: string;
  answer: string | string[];
  type: 'multiple-choice' | 'open-ended';

  // ✅ Added field to support weighted calibration scoring
  weight?: number;
}


export interface ParameterRange {
  temperature: { min: number; max: number };
  topP: { min: number; max: number };
  maxTokens: { min: number; max: number };
  frequencyPenalty: { min: number; max: number };
}

export interface ExperimentParameters {
  temperature: number;
  topP: number;
  maxTokens: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export interface LLMResponse {
  id: string;
  text: string;
  parameters: ExperimentParameters;
  metrics: ResponseMetrics;
  timestamp: number;
  prompt: string;
}

export interface ResponseMetrics {
  length: number;
  completeness: number;
  coherence: number;
  structure: number;
  lexicalDiversity: number;
  creativity: number;
}

export interface Experiment {
  id: string;
  prompt: string;
  parameters: ExperimentParameters;
  responses: LLMResponse[];
  timestamp: number;
  calibrationId?: string;
}

export type ExportFormat = 'csv' | 'json';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export interface CalibrationQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'open-ended';
  options?: string[];
  category: 'creativity' | 'precision' | 'balance';
}
