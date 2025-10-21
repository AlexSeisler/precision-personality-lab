import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logAuditEvent } from '@/lib/api/audit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// --- Utility: Metrics computation ---
function calculateMetrics(text: string) {
  const words = text.trim().split(/\s+/);
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const uniqueWords = new Set(words.map((w) => w.toLowerCase()));

  return {
    creativity: Math.min(100, (uniqueWords.size / words.length) * 150),
    coherence: Math.min(100, (sentences.length / words.length) * 400),
    structure: Math.min(100, sentences.length > 0 ? 80 + Math.random() * 20 : 50),
    completeness: Math.min(100, words.length > 50 ? 90 + Math.random() * 10 : (words.length / 50) * 90),
    length: words.length,
    lexicalDiversity: (uniqueWords.size / words.length) * 100,
  };
}

// --- Utility: Unified JSON response format ---
function jsonResponse(success: boolean, data: any, message?: string, status = 200) {
  return NextResponse.json(
    {
      success,
      status,
      message: message || (success ? 'OK' : 'Error'),
      data,
    },
    { status }
  );
}

// --- Utility: LLM call with retry & telemetry ---
async function safeFetchLLM(request: RequestInit, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(request.url as string, request);
      if (res.ok) return res;

      if (res.status === 429) {
        await logAuditEvent('llm_request_error', {
          code: 429,
          retry: i + 1,
          event_scope: 'llm',
          event_severity: 'warning',
        });
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
        continue;
      }

      throw new Error(`LLM error ${res.status}: ${await res.text()}`);
    } catch (err) {
      if (i === retries) throw err;
    }
  }
  throw new Error('LLM call failed after retries');
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

    const llmApiKey = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY;
    const llmApiUrl = process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions';
    const llmModel = process.env.LLM_MODEL || 'gpt-4o-mini';

    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse(false, {}, 'Server configuration error', 500);
    }

    if (!llmApiKey) {
      return jsonResponse(false, {}, 'Missing LLM API key. Check environment variables.', 500);
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader) return jsonResponse(false, {}, 'Missing authorization header', 401);

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return jsonResponse(false, {}, 'Not authenticated', 401);

    const body = await req.json();
    const { prompt, calibrationId, parameters: customParameters } = body;
    if (!prompt) return jsonResponse(false, {}, 'Prompt is required', 400);

    // --- Fetch calibration (latest or specific) ---
    let calibration = null;
    if (calibrationId) {
      const { data } = await supabase
        .from('calibrations')
        .select('*')
        .eq('id', calibrationId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) calibration = data;
    }
    if (!calibration) {
      const { data } = await supabase
        .from('calibrations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) calibration = data;
    }
    if (!calibration)
      return jsonResponse(false, {}, 'No calibration found. Please complete calibration first.', 400);

    const parameters = customParameters || {
      temperature: (Number(calibration.temperature_min) + Number(calibration.temperature_max)) / 2,
      topP: (Number(calibration.top_p_min) + Number(calibration.top_p_max)) / 2,
      maxTokens: Math.floor((calibration.max_tokens_min + calibration.max_tokens_max) / 2),
      frequencyPenalty: (Number(calibration.frequency_penalty_min) + Number(calibration.frequency_penalty_max)) / 2,
      presencePenalty: 0,
    };

    const correlationId = `${user.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await logAuditEvent('llm_stream_started', {
      correlation_id: correlationId,
      event_scope: 'llm',
      event_severity: 'info',
      calibration_id: calibration.id,
    });

    // --- Streaming LLM Call ---
    const controller = new AbortController();
    const llmRequest: RequestInit = {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${llmApiKey}`,
      },
      body: JSON.stringify({
        model: llmModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: parameters.temperature,
        top_p: parameters.topP,
        max_tokens: parameters.maxTokens,
        frequency_penalty: parameters.frequencyPenalty,
        stream: true,
      }),
    };

    const llmStartTime = Date.now();
    const llmResponse = await fetch(llmApiUrl, llmRequest);

    if (!llmResponse.ok) {
      const errText = await llmResponse.text();
      await logAuditEvent('llm_request_error', {
        correlation_id: correlationId,
        error: errText,
        status: llmResponse.status,
        event_scope: 'llm',
        event_severity: 'error',
      });
      return jsonResponse(false, { error: errText }, 'LLM API failed', 502);
    }

    // --- Stream decode ---
    const reader = llmResponse.body?.getReader();
    const decoder = new TextDecoder();
    let generatedText = '';
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        generatedText += decoder.decode(value);
      }
    } else {
      generatedText = await llmResponse.text();
    }

    const latencyMs = Date.now() - llmStartTime;
    if (!generatedText.trim()) generatedText = `No text returned by model "${llmModel}".`;

    const metrics = calculateMetrics(generatedText);

    // --- Persist experiment ---
    const { data: experiment, error: experimentError } = await supabase
      .from('experiments')
      .insert({
        user_id: user.id,
        calibration_id: calibration.id,
        prompt,
        parameters,
        responses: [
          {
            id: crypto.randomUUID(),
            text: generatedText,
            parameters,
            metrics,
            timestamp: Date.now(),
            prompt,
            latency_ms: latencyMs,
          },
        ],
        saved: true,
        discarded: false,
      })
      .select()
      .single();

    if (experimentError)
      return jsonResponse(false, { error: experimentError.message }, 'Failed to save experiment', 500);

    // --- Analytics & Audit Sync ---
    await supabase
      .from('analytics_summaries')
      .upsert({
        user_id: user.id,
        calibration_id: calibration.id,
        metrics_summary: metrics,
      });

    await logAuditEvent('experiment_generated', {
      experiment_id: experiment.id,
      calibration_id: calibration.id,
      latency_ms: latencyMs,
      tokens_used: parameters.maxTokens,
      model: llmModel,
      correlation_id: correlationId,
      event_scope: 'llm',
      event_severity: 'info',
    });

    await logAuditEvent('llm_stream_completed', {
      correlation_id: correlationId,
      total_latency_ms: Date.now() - startTime,
      event_scope: 'llm',
      event_severity: 'info',
    });

    return jsonResponse(
      true,
      {
        experiment,
        response: generatedText,
        metrics,
        latency_ms: latencyMs,
        total_latency_ms: Date.now() - startTime,
      },
      'Experiment generated successfully',
      200
    );
  } catch (error: any) {
    console.error('Generate endpoint error:', error);
    await logAuditEvent('llm_request_error', {
      error: error.message,
      stack: error.stack,
      event_scope: 'llm',
      event_severity: 'critical',
    });
    return jsonResponse(false, { error: error.message }, 'Internal server error', 500);
  }
}
