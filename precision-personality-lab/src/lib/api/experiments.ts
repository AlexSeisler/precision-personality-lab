import { supabase } from '@/lib/supabase/client';
import { logAuditEvent } from '@/lib/api/audit';
import type { Database } from '@/lib/supabase/types';
import type { LLMResponse, ExperimentParameters } from '@/types';

type ExperimentRow = Database['public']['Tables']['experiments']['Row'];
type ExperimentInsert = Database['public']['Tables']['experiments']['Insert'];

/** Internal utility: write telemetry entry */
async function recordTelemetry(event: string, meta: Record<string, unknown>) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('system_metrics').insert({
      path: '/lib/api/experiments',
      method: event,
      latency_ms: meta?.latency_ms || 0,
      status: meta?.status || 200,
      user_id: user.id,
      extra: meta,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('⚠️ telemetry record failed:', err);
  }
}

/** Save new experiment + responses */
export async function saveExperiment(
  prompt: string,
  parameters: ExperimentParameters,
  responses: LLMResponse[],
  calibrationId?: string
) {
  const start = Date.now();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const experimentData: ExperimentInsert = {
      user_id: user.id,
      calibration_id: calibrationId || null,
      prompt,
      parameters: {
        temperature: parameters.temperature,
        topP: parameters.topP,
        maxTokens: parameters.maxTokens,
        frequencyPenalty: parameters.frequencyPenalty,
        presencePenalty: parameters.presencePenalty,
      },
      responses: responses.map(r => ({
        id: r.id,
        text: r.text,
        parameters: r.parameters,
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

    const latency_ms = Date.now() - start;

    if (error) {
      await logAuditEvent('experiment_failed', {
        prompt_length: prompt.length,
        error: error.message,
      });
      await recordTelemetry('experiment_failed', { latency_ms, status: 500 });
      throw error;
    }

    await logAuditEvent('experiment_created', {
      experiment_id: data.id,
      calibration_id: calibrationId,
      response_count: responses.length,
      latency_ms,
      parameters,
    });

    await recordTelemetry('experiment_created', {
      latency_ms,
      status: 200,
      response_count: responses.length,
    });

    return data;
  } catch (error) {
    const latency_ms = Date.now() - start;
    await logAuditEvent('experiment_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      latency_ms,
    });
    await recordTelemetry('experiment_failed', { latency_ms, status: 500 });
    throw error;
  }
}

/** Fetch all experiments for a user */
export async function getAllExperiments(userId: string): Promise<ExperimentRow[]> {
  const start = Date.now();
  try {
    const { data, error } = await supabase
      .from('experiments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    await recordTelemetry('get_all_experiments', { latency_ms: Date.now() - start, status: 200 });
    return data || [];
  } catch (error) {
    await recordTelemetry('get_all_experiments', { latency_ms: Date.now() - start, status: 500 });
    throw error;
  }
}

/** Fetch experiments filtered by calibration_id */
export async function getExperimentsByCalibration(
  userId: string,
  calibrationId: string
): Promise<ExperimentRow[]> {
  const start = Date.now();
  try {
    const { data, error } = await supabase
      .from('experiments')
      .select('*')
      .eq('user_id', userId)
      .eq('calibration_id', calibrationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    await recordTelemetry('get_experiments_by_calibration', {
      latency_ms: Date.now() - start,
      status: 200,
    });
    return data || [];
  } catch (error) {
    await recordTelemetry('get_experiments_by_calibration', {
      latency_ms: Date.now() - start,
      status: 500,
    });
    throw error;
  }
}

/** Delete experiment */
export async function deleteExperiment(experimentId: string) {
  const start = Date.now();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');

  const { error } = await supabase
    .from('experiments')
    .delete()
    .eq('id', experimentId);

  const latency_ms = Date.now() - start;

  if (error) {
    await recordTelemetry('experiment_delete_failed', { latency_ms, status: 500 });
    throw error;
  }

  await logAuditEvent('experiment_deleted', { experiment_id: experimentId, latency_ms });
  await recordTelemetry('experiment_deleted', { latency_ms, status: 200 });
}

/** Aggregate all LLM responses across experiments */
export async function getExperimentResponses(userId: string): Promise<LLMResponse[]> {
  const start = Date.now();
  try {
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
        if (Array.isArray(responses)) allResponses.push(...responses);
      }
    }

    await recordTelemetry('get_experiment_responses', {
      latency_ms: Date.now() - start,
      status: 200,
      response_count: allResponses.length,
    });

    return allResponses;
  } catch (error) {
    await recordTelemetry('get_experiment_responses', {
      latency_ms: Date.now() - start,
      status: 500,
    });
    throw error;
  }
}
