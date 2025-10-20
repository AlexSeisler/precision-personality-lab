import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
import type { CalibrationAnswer, ParameterRange } from '@/types';

type CalibrationRow = Database['public']['Tables']['calibrations']['Row'];
type CalibrationInsert = Database['public']['Tables']['calibrations']['Insert'];

export async function saveCalibration(
  userId: string,
  mode: 'quick' | 'deep',
  answers: CalibrationAnswer[],
  ranges: ParameterRange,
  insights: string[]
) {
  const calibrationData: CalibrationInsert = {
    user_id: userId,
    mode,
    answers: answers.map((a) => ({
      questionId: a.questionId,
      answer: a.answer,
      weight: a.weight,
    })),
    temperature_min: ranges.temperature.min,
    temperature_max: ranges.temperature.max,
    top_p_min: ranges.topP.min,
    top_p_max: ranges.topP.max,
    max_tokens_min: ranges.maxTokens.min,
    max_tokens_max: ranges.maxTokens.max,
    frequency_penalty_min: ranges.frequencyPenalty.min,
    frequency_penalty_max: ranges.frequencyPenalty.max,
    insights,
  };

  const { data, error } = await supabase
    .from('calibrations')
    .insert(calibrationData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getLatestCalibration(userId: string): Promise<{
  ranges: ParameterRange;
  insights: string[];
  mode: 'quick' | 'deep';
  answers: CalibrationAnswer[];
} | null> {
  const { data, error } = await supabase
    .from('calibrations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    ranges: {
      temperature: { min: Number(data.temperature_min), max: Number(data.temperature_max) },
      topP: { min: Number(data.top_p_min), max: Number(data.top_p_max) },
      maxTokens: { min: data.max_tokens_min, max: data.max_tokens_max },
      frequencyPenalty: {
        min: Number(data.frequency_penalty_min),
        max: Number(data.frequency_penalty_max),
      },
    },
    insights: data.insights as string[],
    mode: data.mode,
    answers: (data.answers as any[]).map((a) => ({
      questionId: a.questionId,
      answer: a.answer,
      weight: a.weight,
    })),
  };
}

export async function getAllCalibrations(userId: string): Promise<CalibrationRow[]> {
  const { data, error } = await supabase
    .from('calibrations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function deleteCalibration(calibrationId: string) {
  const { error } = await supabase
    .from('calibrations')
    .delete()
    .eq('id', calibrationId);

  if (error) throw error;
}
