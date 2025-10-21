import { NextResponse } from 'next/server';

/**
 * Global error handling middleware.
 * Wraps API route logic in a standardized try/catch structure.
 * Logs audit events when available.
 */
export function withErrorHandler(handler: Function) {
  return async (req: Request, ...args: any[]) => {
    try {
      const result = await handler(req, ...args);
      return result;
    } catch (error: any) {
      console.error('[ErrorHandler] API Error:', error);

      const message = error?.message || 'Internal Server Error';
      const status = error?.status || 500;

      return NextResponse.json(
        { success: false, status, message, data: {} },
        { status }
      );
    }
  };
}

/**
 * Custom error class for structured API responses.
 */
export class APIError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}
