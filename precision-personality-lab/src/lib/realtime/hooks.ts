import { useEffect } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { useUIStore } from '@/store/ui-store';
import { useMetricsStore } from '@/store/metrics-store';
import { logAuditEvent } from '@/lib/api/audit';

export function useRealtimeCalibrations(
  onInsert?: (payload: any) => void,
  onUpdate?: (payload: any) => void,
  onDelete?: (payload: any) => void
) {
  const { user } = useAuth();
  const { addToast } = useUIStore();

  useEffect(() => {
    if (!user) return;

    let channel: RealtimeChannel;

    const setupChannel = async () => {
      channel = supabase
        .channel('calibrations-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'calibrations',
            filter: `user_id=eq.${user.id}`,
          },
          async (payload) => {
            await logAuditEvent('calibration_started', { record: payload.new });
            onInsert?.(payload);
            addToast('✨ Calibration synced', 'info', 2000);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'calibrations',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            onUpdate?.(payload);
            addToast('Calibration updated', 'info', 2000);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'calibrations',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            onDelete?.(payload);
          }
        )
        .subscribe(async (status, err) => {
          if (err) {
            await logAuditEvent('realtime_error', {
              channel: 'calibrations',
              message: err.message
            });
            addToast('Connection error', 'error', 3000);
          }
          if (status === 'SUBSCRIBED') {
            await logAuditEvent('realtime_connected', {
              channel: 'calibrations',
            });
          }
          if (status === 'CLOSED') {
            await logAuditEvent('realtime_disconnected', {
              channel: 'calibrations',
            });
          }
        });
    };

    setupChannel();

    const handleOnline = () => {
      setupChannel();
      addToast('Back online - reconnecting', 'info', 2000);
    };

    const handleOffline = () => {
      logAuditEvent('realtime_disconnected', {
        channel: 'calibrations',
        reason: 'offline'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, onInsert, onUpdate, onDelete, addToast]);
}

export function useRealtimeExperiments(
  onInsert?: (payload: any) => void,
  onUpdate?: (payload: any) => void,
  onDelete?: (payload: any) => void
) {
  const { user } = useAuth();
  const { addToast } = useUIStore();
  const { computeSummary } = useMetricsStore();

  useEffect(() => {
    if (!user) return;

    let channel: RealtimeChannel;

    const setupChannel = async () => {
      channel = supabase
        .channel('experiments-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'experiments',
            filter: `user_id=eq.${user.id}`,
          },
          async (payload) => {
            await logAuditEvent('experiment_inserted', { record: payload.new });

            if (payload.new?.responses && Array.isArray(payload.new.responses)) {
              await computeSummary(payload.new.responses, payload.new.calibration_id);
            }

            onInsert?.(payload);
            addToast('🧪 New experiment synced', 'success', 2000);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'experiments',
            filter: `user_id=eq.${user.id}`,
          },
          async (payload) => {
            await logAuditEvent('experiment_updated', { record: payload.new });
            onUpdate?.(payload);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'experiments',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            onDelete?.(payload);
          }
        )
        .subscribe(async (status, err) => {
          if (err) {
            await logAuditEvent('realtime_error', {
              channel: 'experiments',
              message: err.message
            });
            addToast('Connection error', 'error', 3000);
          }
          if (status === 'SUBSCRIBED') {
            await logAuditEvent('realtime_connected', {
              channel: 'experiments',
            });
          }
          if (status === 'CLOSED') {
            await logAuditEvent('realtime_disconnected', {
              channel: 'experiments',
            });
          }
        });
    };

    setupChannel();

    const handleOnline = () => {
      setupChannel();
      addToast('Back online - reconnecting', 'info', 2000);
    };

    const handleOffline = () => {
      logAuditEvent('realtime_disconnected', {
        channel: 'experiments',
        reason: 'offline'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, onInsert, onUpdate, onDelete, addToast, computeSummary]);
}
