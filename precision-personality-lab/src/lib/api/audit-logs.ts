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
  | 'analytics_computed'
  | 'auth_redirect'
  | 'auth_redirect_error';

function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

// Regex for UUID v4 format validation
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Internal recursion guard to prevent infinite audit loops
let auditInProgress = false;

export async function logAuditEvent(
  eventType: AuditEventType,
  eventData: Record<string, unknown> = {},
  source: 'client' | 'server' = 'client'
) {
  if (auditInProgress) {
    console.warn(`⏸️ Skipping nested audit event: ${eventType}`);
    return;
  }

  auditInProgress = true;

  try {
    let { data: { user } } = await supabase.auth.getUser();

    // 🧠 Retry once if user not immediately available
    if (!user) {
      await new Promise((r) => setTimeout(r, 150));
      const retry = await supabase.auth.getUser();
      user = retry.data.user;
    }

    // 🚫 Bail if still no user or invalid UUID
    if (!user?.id || !UUID_REGEX.test(user.id)) {
      console.warn(`⚠️ Skipping audit log "${eventType}"- invalid or missing user.id`, {
        receivedId: user?.id,
      });
      return;
    }

    const correlation_id = generateCorrelationId();

    const { error } = await supabase.from('audit_logs').insert({
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
      console.error('❌ Failed to log audit event:', error);
    }
  } catch (err) {
    console.error('Audit log exception:', err);
  } finally {
    auditInProgress = false;
  }
}

export async function getAuditLogs(userId: string, limit = 100) {
  if (!userId || !UUID_REGEX.test(userId)) {
    console.warn('⚠️ Invalid userId for getAuditLogs:', userId);
    return [];
  }

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
  if (!userId || !UUID_REGEX.test(userId)) {
    console.warn('⚠️ Invalid userId for getAuditLogsByEventType:', userId);
    return [];
  }

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
