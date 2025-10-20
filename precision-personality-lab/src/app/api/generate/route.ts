import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server-client';
import { logAuditEvent } from '@/lib/api/audit-logs';

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { prompt, calibrationId } = await req.json();

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

    const llmApiKey = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY;
    const llmApiUrl = process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions';

    if (!llmApiKey) {
      return NextResponse.json(
        { error: 'LLM API key not configured' },
        { status: 500 }
      );
    }

    const parameters = {
      temperature: (Number(calibration.temperature_min) + Number(calibration.temperature_max)) / 2,
      top_p: (Number(calibration.top_p_min) + Number(calibration.top_p_max)) / 2,
      max_tokens: Math.floor((calibration.max_tokens_min + calibration.max_tokens_max) / 2),
      frequency_penalty: (Number(calibration.frequency_penalty_min) + Number(calibration.frequency_penalty_max)) / 2,
    };

    const llmResponse = await fetch(llmApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${llmApiKey}`,
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: parameters.temperature,
        top_p: parameters.top_p,
        max_tokens: parameters.max_tokens,
        frequency_penalty: parameters.frequency_penalty,
      }),
    });

    if (!llmResponse.ok) {
      const errorData = await llmResponse.json().catch(() => ({}));
      console.error('LLM API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate response from LLM' },
        { status: 500 }
      );
    }

    const llmData = await llmResponse.json();
    const generatedText = llmData.choices?.[0]?.message?.content || '';

    const mockMetrics = {
      creativity: Math.random() * 100,
      coherence: Math.random() * 100,
      structure: Math.random() * 100,
      completeness: Math.random() * 100,
    };

    const responses = [
      {
        id: crypto.randomUUID(),
        text: generatedText,
        parameters: {
          temperature: parameters.temperature,
          topP: parameters.top_p,
          maxTokens: parameters.max_tokens,
          frequencyPenalty: parameters.frequency_penalty,
          presencePenalty: 0,
        },
        metrics: mockMetrics,
        timestamp: Date.now(),
        prompt,
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
          topP: parameters.top_p,
          maxTokens: parameters.max_tokens,
          frequencyPenalty: parameters.frequency_penalty,
          presencePenalty: 0,
        },
        responses,
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
    });

    return NextResponse.json({
      success: true,
      experiment,
      response: generatedText,
    });
  } catch (error) {
    console.error('Generate endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
