export interface Database {
  public: {
    Tables: {
      calibrations: {
        Row: {
          id: string;
          user_id: string;
          mode: 'quick' | 'deep';
          answers: CalibrationAnswerDB[];
          temperature_min: number;
          temperature_max: number;
          top_p_min: number;
          top_p_max: number;
          max_tokens_min: number;
          max_tokens_max: number;
          frequency_penalty_min: number;
          frequency_penalty_max: number;
          insights: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mode?: 'quick' | 'deep';
          answers: CalibrationAnswerDB[];
          temperature_min: number;
          temperature_max: number;
          top_p_min: number;
          top_p_max: number;
          max_tokens_min: number;
          max_tokens_max: number;
          frequency_penalty_min: number;
          frequency_penalty_max: number;
          insights: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          mode?: 'quick' | 'deep';
          answers?: CalibrationAnswerDB[];
          temperature_min?: number;
          temperature_max?: number;
          top_p_min?: number;
          top_p_max?: number;
          max_tokens_min?: number;
          max_tokens_max?: number;
          frequency_penalty_min?: number;
          frequency_penalty_max?: number;
          insights?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      experiments: {
        Row: {
          id: string;
          user_id: string;
          calibration_id: string | null;
          prompt: string;
          parameters: ExperimentParametersDB;
          responses: LLMResponseDB[];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          calibration_id?: string | null;
          prompt: string;
          parameters: ExperimentParametersDB;
          responses: LLMResponseDB[];
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          calibration_id?: string | null;
          prompt?: string;
          parameters?: ExperimentParametersDB;
          responses?: LLMResponseDB[];
          created_at?: string;
        };
      };
    };
  };
}

export interface CalibrationAnswerDB {
  questionId: string;
  answer: string | number;
  weight: number;
}

export interface ExperimentParametersDB {
  temperature: number;
  topP: number;
  maxTokens: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export interface LLMResponseDB {
  id: string;
  text: string;
  parameters: ExperimentParametersDB;
  metrics: {
    length: number;
    completeness: number;
    coherence: number;
    structure: number;
    lexicalDiversity: number;
    creativity: number;
  };
  timestamp: number;
  prompt: string;
}
