import { supabase } from '../supabase/client';

export type AuditEventType =
  | 'sign_up'
  | 'sign_in'
  | 'auth_error'
  | 'sign_out'
  | 'calibration_started'
  | 'calibration_completed'
  | 'calibration_failed'
  | 'experiment_created'
  | 'experiment_updated'
  | 'experiment_deleted'
  | 'experiment_generated'
  | 'experiment_inserted'
  | 'experiment_saved'
  | 'experiment_discarded'
  | 'data_exported'
  | 'data_exported_full'
  | 'realtime_connected'
  | 'realtime_disconnected'
  | 'realtime_error'
  | 'analytics_updated'
  | 'analytics_computed';

function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export async function logAuditEvent(
  event_type: AuditEventType,
  event_data: Record<string, unknown> = {},
  source: 'client' | 'server' = 'client'
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.warn('[Audit] No authenticated user for event:', event_type);
      return;
    }

    const correlation_id = generateCorrelationId();

    const auditEntry = {
      user_id: user.id,
      event_type,
      event_data: {
        ...event_data,
        correlation_id,
        source,
        timestamp: new Date().toISOString(),
      },
    };

    const { error } = await supabase.from('audit_logs').insert(auditEntry);

    if (error) {
      console.error('[Audit] Failed to log event:', event_type, error);
    }
  } catch (err) {
    console.error('[Audit] Exception logging event:', event_type, err);
  }
}
