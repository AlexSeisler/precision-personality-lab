import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
import type { LLMResponse, ExperimentParameters } from '@/types';

type ExperimentRow = Database['public']['Tables']['experiments']['Row'];
type ExperimentInsert = Database['public']['Tables']['experiments']['Insert'];

export async function saveExperiment(
  userId: string,
  prompt: string,
  parameters: ExperimentParameters,
  responses: LLMResponse[],
  calibrationId?: string
) {
  const experimentData: ExperimentInsert = {
    user_id: userId,
    calibration_id: calibrationId || null,
    prompt,
    parameters: {
      temperature: parameters.temperature,
      topP: parameters.topP,
      maxTokens: parameters.maxTokens,
      frequencyPenalty: parameters.frequencyPenalty,
      presencePenalty: parameters.presencePenalty,
    },
    responses: responses.map((r) => ({
      id: r.id,
      text: r.text,
      parameters: {
        temperature: r.parameters.temperature,
        topP: r.parameters.topP,
        maxTokens: r.parameters.maxTokens,
        frequencyPenalty: r.parameters.frequencyPenalty,
        presencePenalty: r.parameters.presencePenalty,
      },
      metrics: r.metrics,
      timestamp: r.timestamp,
      prompt: r.prompt,
    })),
  };

  const { data, error } = await supabase
    .from('experiments')
    .insert(experimentData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAllExperiments(userId: string): Promise<ExperimentRow[]> {
  const { data, error } = await supabase
    .from('experiments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getExperimentsByCalibration(
  userId: string,
  calibrationId: string
): Promise<ExperimentRow[]> {
  const { data, error } = await supabase
    .from('experiments')
    .select('*')
    .eq('user_id', userId)
    .eq('calibration_id', calibrationId)
    .order('created_at', { ascending: false});

  if (error) throw error;
  return data || [];
}

export async function deleteExperiment(experimentId: string) {
  const { error } = await supabase
    .from('experiments')
    .delete()
    .eq('id', experimentId);

  if (error) throw error;
}

export async function getExperimentResponses(userId: string): Promise<LLMResponse[]> {
  const { data, error } = await supabase
    .from('experiments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const allResponses: LLMResponse[] = [];

  if (data) {
    for (const experiment of data) {
      const responses = experiment.responses as any[];
      if (Array.isArray(responses)) {
        allResponses.push(...responses);
      }
    }
  }

  return allResponses;
}
