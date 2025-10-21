import { NextResponse } from 'next/server';

// Simple in-memory rate limit tracker
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

const LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const REQUEST_LIMIT = 30; // Max requests per minute per user/IP

export async function withRateLimit(handler: Function) {
  return async (req: Request, ...args: any[]) => {
    try {
      const ip =
        req.headers.get('x-forwarded-for') ||
        (req as any).ip ||
        'unknown';
      const key = `rate-limit:${ip}`;

      const now = Date.now();
      const entry = rateLimitMap.get(key) || { count: 0, lastReset: now };

      // Reset window if expired
      if (now - entry.lastReset > LIMIT_WINDOW_MS) {
        entry.count = 0;
        entry.lastReset = now;
      }

      entry.count += 1;
      rateLimitMap.set(key, entry);

      if (entry.count > REQUEST_LIMIT) {
        return NextResponse.json(
          {
            success: false,
            status: 429,
            message: 'Rate limit exceeded. Please wait before retrying.',
          },
          { status: 429 }
        );
      }

      return await handler(req, ...args);
    } catch (error: any) {
      console.error('Rate limit middleware error:', error);
      return NextResponse.json(
        { success: false, status: 500, message: 'Rate limiter internal error' },
        { status: 500 }
      );
    }
  };
}

export function getRateLimitStatus(ip: string) {
  const key = `rate-limit:${ip}`;
  return rateLimitMap.get(key) || { count: 0, lastReset: Date.now() };
}