/**
 * ✅ Unified audit logging shim for legacy imports
 * -------------------------------------------------
 * This bridges old audit.ts references to the new audit-logs.ts core,
 * while adding lightweight throttling and log aggregation.
 *
 * Safe for both client & server contexts.
 */

import { logAuditEvent as coreLogAuditEvent } from '@/lib/api/audit-logs';

// ⏱️ Prevents spamming Supabase with identical events in a short window
const recentEvents = new Map<string, number>();
const THROTTLE_WINDOW_MS = 2000;

/**
 * Generates a short correlation ID for tracing distributed events.
 */
function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Main wrapper for legacy compatibility
 */
export async function logAuditEvent(
  eventType: string,
  eventData: Record<string, unknown> = {},
  source: 'client' | 'server' = 'client'
): Promise<void> {
  try {
    const key = `${eventType}:${JSON.stringify(eventData)}`;
    const now = Date.now();

    // 🧠 Simple throttle: ignore identical events fired too close together
    const lastEventTime = recentEvents.get(key);
    if (lastEventTime && now - lastEventTime < THROTTLE_WINDOW_MS) {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[Audit] Skipped duplicate event: ${eventType}`);
      }
      return;
    }

    recentEvents.set(key, now);

    // 🚀 Forward the call to our main audit system
    await coreLogAuditEvent(eventType as any, {
      ...eventData,
      correlation_id: generateCorrelationId(),
      redirected_from: 'audit.ts',
    }, source);
  } catch (error) {
    console.error('[Audit] Error forwarding event:', eventType, error);
  }
}

/**
 * Convenience batch logger for grouped actions
 */
export async function logAuditBatch(
  events: { type: string; data?: Record<string, unknown> }[],
  source: 'client' | 'server' = 'client'
) {
  for (const e of events) {
    await logAuditEvent(e.type, e.data || {}, source);
  }
}

/**
 * Optional developer utility: flush throttled events (for testing)
 */
export function clearAuditThrottleCache() {
  recentEvents.clear();
}
