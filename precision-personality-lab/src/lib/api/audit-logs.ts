import { supabase } from '@/lib/supabase/client';

export type AuditEventType =
  | 'sign_in'
  | 'sign_out'
  | 'sign_up'
  | 'auth_error'
  | 'calibration_started'
  | 'calibration_completed'
  | 'calibration_failed'
  | 'calibration_deleted'
  | 'experiment_created'
  | 'experiment_updated'
  | 'experiment_deleted'
  | 'experiment_generated'
  | 'experiment_inserted'
  | 'experiment_saved'
  | 'experiment_discarded'
  | 'data_exported'
  | 'data_exported_full'
  | 'settings_changed'
  | 'session_restored'
  | 'realtime_connected'
  | 'realtime_disconnected'
  | 'realtime_error'
  | 'analytics_updated'
  | 'analytics_computed';

function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export async function logAuditEvent(
  eventType: AuditEventType,
  eventData: Record<string, unknown> = {},
  source: 'client' | 'server' = 'client'
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.warn('No authenticated user for audit event:', eventType);
      return;
    }

    const correlation_id = generateCorrelationId();

    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        event_type: eventType,
        event_data: {
          ...eventData,
          correlation_id,
          source,
          timestamp: new Date().toISOString(),
        },
      });

    if (error) {
      console.error('Failed to log audit event:', error);
    }
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
}

export async function getAuditLogs(userId: string, limit = 100) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getAuditLogsByEventType(
  userId: string,
  eventType: AuditEventType,
  limit = 50
) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('event_type', eventType)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}
