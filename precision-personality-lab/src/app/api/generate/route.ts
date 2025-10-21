import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logAuditEvent } from '@/lib/api/audit';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';
import { withTelemetry } from '@/lib/api/middleware/telemetry';
import { withRateLimit } from '@/lib/api/middleware/rate-limit';

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
    completeness: Math.min(
      100,
      words.length > 50 ? 90 + Math.random() * 10 : (words.length / 50) * 90
    ),
    length: words.length,
    lexicalDiversity: (uniqueWords.size / words.length) * 100,
  };
}

// --- Utility: Unified JSON response format ---
function jsonResponse(success: boolean, data: any, message?: string, status = 200) {
  return NextResponse.json(
    { success, status, message: message || (success ? 'OK' : 'Error'), data },
    { status }
  );
}

// --- Core handler ---
async function generateHandler(req: NextRequest) {
  const startTime = Date.now();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
  const llmApiKey = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY;
  const llmApiUrl = process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions';
  const llmModel = process.env.LLM_MODEL || 'gpt-4o-mini';

  if (!supabaseUrl || !supabaseAnonKey)
    return jsonResponse(false, {}, 'Server configuration error', 500);
  if (!llmApiKey)
    return jsonResponse(false, {}, 'Missing LLM API key. Check environment variables.', 500);

    // --- Auth block (use anon client for JWT validation) ---
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return jsonResponse(false, {}, 'Missing authorization header', 401);

  const token = authHeader.replace('Bearer ', '').trim();

  // Create two Supabase clients: anon for auth validation, service for DB ops
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  console.log('[AUTH DEBUG] Validating Supabase JWT (anon client)...');
  const { data: authData, error: authError } = await supabaseAnon.auth.getUser(token);

  if (authError || !authData?.user) {
    console.error('[AUTH DEBUG] Failed to authenticate user:', authError);
    return jsonResponse(false, {}, 'Not authenticated', 401);
  }

  const user = authData.user;
  console.log('[AUTH DEBUG] Authenticated user:', user.id, user.email);

  // Use the admin client for all privileged DB queries
  const supabase = supabaseAdmin;


  // --- Parse request body ---
  const body = await req.json();
  const { prompt, calibrationId, parameters: customParameters } = body;
  if (!prompt) return jsonResponse(false, {}, 'Prompt is required', 400);

  // --- Retrieve calibration ---
  let calibration = null;
  const { data: calibrationData } = await supabase
    .from('calibrations')
    .select('*')
    .eq('id', calibrationId || '')
    .eq('user_id', user.id)
    .maybeSingle();

  calibration = calibrationData;
  if (!calibration) {
    const { data: latest } = await supabase
      .from('calibrations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    calibration = latest;
  }

  if (!calibration)
    return jsonResponse(false, {}, 'No calibration found. Please complete calibration first.', 400);

  const parameters = customParameters || {
    temperature:
      (Number(calibration.temperature_min) + Number(calibration.temperature_max)) / 2,
    topP: (Number(calibration.top_p_min) + Number(calibration.top_p_max)) / 2,
    maxTokens: Math.floor(
      (calibration.max_tokens_min + calibration.max_tokens_max) / 2
    ),
    frequencyPenalty:
      (Number(calibration.frequency_penalty_min) +
        Number(calibration.frequency_penalty_max)) /
      2,
    presencePenalty: 0,
  };

  const correlationId = `${user.id}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
  await logAuditEvent('llm_stream_started', {
    correlation_id: correlationId,
    event_scope: 'llm',
    event_severity: 'info',
    calibration_id: calibration.id,
  });

  // --- Call LLM API ---
  const llmStartTime = Date.now();
  const llmResponse = await fetch(llmApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${llmApiKey}` },
    body: JSON.stringify({
      model: llmModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: parameters.temperature,
      top_p: parameters.topP,
      max_tokens: parameters.maxTokens,
      frequency_penalty: parameters.frequencyPenalty,
      stream: true,
    }),
  });

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

  // --- Stream response ---
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
    return jsonResponse(
      false,
      { error: experimentError.message },
      'Failed to save experiment',
      500
    );

  // --- Analytics & Audit ---
  await supabase.from('analytics_summaries').upsert({
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
}

// --- Compose middleware chain (diagnostic version) ---
let wrappedHandler: any = generateHandler;

try {
  console.log('[DEBUG] Type before rate-limit:', typeof wrappedHandler);
  wrappedHandler = withRateLimit(wrappedHandler);
  console.log('[DEBUG] After rate-limit:', typeof wrappedHandler);

  wrappedHandler = withTelemetry(wrappedHandler);
  console.log('[DEBUG] After telemetry:', typeof wrappedHandler);

  wrappedHandler = withErrorHandler(wrappedHandler);
  console.log('[DEBUG] After error handler:', typeof wrappedHandler);
} catch (err) {
  console.error('[DEBUG] Middleware wrapping failed:', err);
}

export const POST = async (req: Request) => {
  console.log('[DEBUG] POST handler executing...');
  console.log('[DEBUG] Type before invoke:', typeof wrappedHandler);
  return await wrappedHandler(req);
};
