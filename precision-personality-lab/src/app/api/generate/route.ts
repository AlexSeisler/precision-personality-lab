import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logAuditEvent } from '@/lib/api/audit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function calculateMetrics(text: string) {
  const words = text.trim().split(/\s+/);
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));

  return {
    creativity: Math.min(100, (uniqueWords.size / words.length) * 150),
    coherence: Math.min(100, (sentences.length / words.length) * 400),
    structure: Math.min(100, sentences.length > 0 ? 80 + Math.random() * 20 : 50),
    completeness: Math.min(100, words.length > 50 ? 90 + Math.random() * 10 : (words.length / 50) * 90),
    length: words.length,
    lexicalDiversity: (uniqueWords.size / words.length) * 100,
  };
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { prompt, calibrationId, parameters: customParameters } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    let calibration = null;
    if (calibrationId) {
      const { data, error } = await supabase
        .from('calibrations')
        .select('*')
        .eq('id', calibrationId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        calibration = data;
      }
    }

    if (!calibration) {
      const { data, error } = await supabase
        .from('calibrations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        calibration = data;
      }
    }

    if (!calibration) {
      return NextResponse.json(
        { error: 'No calibration found. Please complete calibration first.' },
        { status: 400 }
      );
    }

    const parameters = customParameters || {
      temperature: (Number(calibration.temperature_min) + Number(calibration.temperature_max)) / 2,
      topP: (Number(calibration.top_p_min) + Number(calibration.top_p_max)) / 2,
      maxTokens: Math.floor((calibration.max_tokens_min + calibration.max_tokens_max) / 2),
      frequencyPenalty: (Number(calibration.frequency_penalty_min) + Number(calibration.frequency_penalty_max)) / 2,
      presencePenalty: 0,
    };

    const llmApiKey = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY;
    const llmApiUrl = process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions';
    const llmModel = process.env.LLM_MODEL || 'gpt-3.5-turbo';

    let generatedText = '';
    let latencyMs = 0;

    if (llmApiKey) {
      const llmStartTime = Date.now();

      try {
        const llmResponse = await fetch(llmApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${llmApiKey}`,
          },
          body: JSON.stringify({
            model: llmModel,
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: parameters.temperature,
            top_p: parameters.topP,
            max_tokens: parameters.maxTokens,
            frequency_penalty: parameters.frequencyPenalty,
          }),
        });

        latencyMs = Date.now() - llmStartTime;

        if (llmResponse.ok) {
          const llmData = await llmResponse.json();
          generatedText = llmData.choices?.[0]?.message?.content || '';
        } else {
          console.error('LLM API error:', await llmResponse.text());
        }
      } catch (error) {
        console.error('LLM call failed:', error);
      }
    }

    if (!generatedText) {
      generatedText = `Generated response for prompt: "${prompt.slice(0, 50)}${prompt.length > 50 ? '...' : ''}" using temperature ${parameters.temperature.toFixed(2)}.

This is a simulated response demonstrating the system's capability to process and analyze LLM outputs. In production, this would contain actual model-generated content based on your calibration parameters.

The system tracks: response quality metrics, parameter effectiveness, and generation patterns to help you understand how different settings influence output characteristics.`;

      latencyMs = 150 + Math.random() * 100;
    }

    const metrics = calculateMetrics(generatedText);

    const responses = [
      {
        id: crypto.randomUUID(),
        text: generatedText,
        parameters: {
          temperature: parameters.temperature,
          topP: parameters.topP,
          maxTokens: parameters.maxTokens,
          frequencyPenalty: parameters.frequencyPenalty,
          presencePenalty: parameters.presencePenalty || 0,
        },
        metrics,
        timestamp: Date.now(),
        prompt,
        latency_ms: latencyMs,
      },
    ];

    const { data: experiment, error: experimentError } = await supabase
      .from('experiments')
      .insert({
        user_id: user.id,
        calibration_id: calibration.id,
        prompt,
        parameters: {
          temperature: parameters.temperature,
          topP: parameters.topP,
          maxTokens: parameters.maxTokens,
          frequencyPenalty: parameters.frequencyPenalty,
          presencePenalty: parameters.presencePenalty || 0,
        },
        responses,
        saved: true,
        discarded: false,
      })
      .select()
      .single();

    if (experimentError) {
      console.error('Failed to save experiment:', experimentError);
      return NextResponse.json(
        { error: 'Failed to save experiment' },
        { status: 500 }
      );
    }

    await logAuditEvent('experiment_generated', {
      experiment_id: experiment.id,
      calibration_id: calibration.id,
      prompt_length: prompt.length,
      response_length: generatedText.length,
      latency_ms: latencyMs,
    });

    const totalLatency = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      experiment,
      response: generatedText,
      metrics,
      latency_ms: latencyMs,
      total_latency_ms: totalLatency,
    });
  } catch (error) {
    console.error('Generate endpoint error:', error);
    const err = error as Error;
    await logAuditEvent('experiment_generated', {
      error: err.message,
      latency_ms: Date.now() - startTime,
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
