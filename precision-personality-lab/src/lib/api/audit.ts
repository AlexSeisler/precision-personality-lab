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
  | 'realtime_connected'
  | 'realtime_disconnected'
  | 'realtime_error'
  | 'analytics_updated'
  | 'analytics_computed';

export async function logAuditEvent(
  event_type: AuditEventType,
  event_data: Record<string, unknown> = {}
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.warn('[Audit] No authenticated user for event:', event_type);
      return;
    }

    const { error } = await supabase.from('audit_logs').insert({
      user_id: user.id,
      event_type,
      event_data,
    });

    if (error) {
      console.error('[Audit] Failed to log event:', event_type, error);
    }
  } catch (err) {
    console.error('[Audit] Exception logging event:', event_type, err);
  }
}
