import { supabase } from '@/lib/supabase/client';
import { logAuditEvent } from '@/lib/api/audit';
import type { Database } from '@/lib/supabase/types';
import type { CalibrationAnswer, ParameterRange } from '@/types';

type CalibrationRow = Database['public']['Tables']['calibrations']['Row'];
type CalibrationInsert = Database['public']['Tables']['calibrations']['Insert'];

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// --- Safe telemetry stub (no DB writes)
async function recordTelemetry(event: string, meta: Record<string, unknown>) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id || !UUID_REGEX.test(user.id)) {
      console.warn(`⚠️ Skipping telemetry (${event}) — invalid user`);
      return;
    }

    console.info('📊 Telemetry:', {
      event,
      path: '/lib/api/calibrations',
      user: user.id,
      meta,
    });
  } catch (err) {
    console.warn('⚠️ telemetry log failed:', err);
  }
}

export async function saveCalibration(
  mode: 'quick' | 'deep',
  answers: CalibrationAnswer[],
  ranges: ParameterRange,
  insights: string[]
) {
  const start = Date.now();
  try {
    await logAuditEvent('calibration_started', { mode });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id || !UUID_REGEX.test(user.id)) throw new Error('No authenticated user');

    const calibrationData: CalibrationInsert = {
      user_id: user.id,
      mode,
      answers: answers.map(a => ({
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

    const latency_ms = Date.now() - start;

    if (error) {
      await logAuditEvent('calibration_failed', { mode, error: error.message });
      await recordTelemetry('calibration_failed', { mode, latency_ms, status: 500 });
      throw error;
    }

    await logAuditEvent('calibration_completed', {
      calibration_id: data.id,
      mode,
      latency_ms,
      parameter_summary: {
        temp: `${ranges.temperature.min}-${ranges.temperature.max}`,
        topP: `${ranges.topP.min}-${ranges.topP.max}`,
      },
    });

    await recordTelemetry('calibration_completed', { mode, latency_ms, status: 200 });

    return data;
  } catch (error) {
    const latency_ms = Date.now() - start;
    await logAuditEvent('calibration_failed', {
      mode,
      error: error instanceof Error ? error.message : 'Unknown error',
      latency_ms,
    });
    await recordTelemetry('calibration_failed', { mode, latency_ms, status: 500 });
    throw error;
  }
}

export async function getLatestCalibration(userId: string) {
  const start = Date.now();

  if (!userId || !UUID_REGEX.test(userId)) {
    console.warn('⚠️ Invalid userId in getLatestCalibration');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('calibrations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    await recordTelemetry('get_latest_calibration', {
      latency_ms: Date.now() - start,
      status: 200,
    });

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
      answers: (data.answers as any[]).map(a => ({
        questionId: a.questionId,
        answer: a.answer,
        weight: a.weight,
      })),
    };
  } catch (error) {
    await recordTelemetry('get_latest_calibration', {
      latency_ms: Date.now() - start,
      status: 500,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

export async function getAllCalibrations(userId: string): Promise<CalibrationRow[]> {
  const start = Date.now();

  if (!userId || !UUID_REGEX.test(userId)) {
    console.warn('⚠️ Invalid userId in getAllCalibrations');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('calibrations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    await recordTelemetry('get_all_calibrations', {
      latency_ms: Date.now() - start,
      status: 200,
    });

    return data || [];
  } catch (error) {
    await recordTelemetry('get_all_calibrations', {
      latency_ms: Date.now() - start,
      status: 500,
    });
    throw error;
  }
}

export async function deleteCalibration(calibrationId: string) {
  const start = Date.now();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id || !UUID_REGEX.test(user.id)) throw new Error('No authenticated user');

  const { error } = await supabase.from('calibrations').delete().eq('id', calibrationId);
  const latency_ms = Date.now() - start;

  if (error) {
    await recordTelemetry('calibration_delete_failed', { latency_ms, status: 500 });
    throw error;
  }

  await logAuditEvent('calibration_deleted', { calibration_id: calibrationId });
  await recordTelemetry('calibration_deleted', { latency_ms, status: 200 });
}
