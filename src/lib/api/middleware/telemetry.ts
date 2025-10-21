import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Telemetry middleware — logs performance metrics and latency to Supabase.
 * Can be composed with error handler and rate limiter.
 */
export async function withTelemetry(handler: Function) {
  return async (req: Request, ...args: any[]) => {
    const start = Date.now();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

    try {
      const response = await handler(req, ...args);
      const duration = Date.now() - start;

      if (supabase) {
        await supabase.from('system_metrics').insert({
          path: (req as any).url || 'unknown',
          method: req.method,
          latency_ms: duration,
          status: (response as any)?.status || 200,
          created_at: new Date().toISOString(),
        });
      }

      return response;
    } catch (error: any) {
      const duration = Date.now() - start;
      console.error('Telemetry middleware caught error:', error);

      if (supabase) {
        await supabase.from('system_metrics').insert({
          path: (req as any).url || 'unknown',
          method: req.method,
          latency_ms: duration,
          status: 500,
          error_message: error.message || 'Unknown error',
          created_at: new Date().toISOString(),
        });
      }

      return NextResponse.json({ success: false, message: 'Internal telemetry error' }, { status: 500 });
    }
  };
}