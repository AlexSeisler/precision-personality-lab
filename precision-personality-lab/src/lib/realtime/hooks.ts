import { useEffect } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { useUIStore } from '@/store/ui-store';
import { useMetricsStore } from '@/store/metrics-store';
import { logAuditEvent } from '@/lib/api/audit';

export function useRealtimeCalibrations(
  onInsert?: (payload: unknown) => void,
  onUpdate?: (payload: unknown) => void,
  onDelete?: (payload: unknown) => void
) {
  const { user } = useAuth();
  const { addToast, setRealtimeConnected, updateLastSyncTime } = useUIStore();

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
            setRealtimeConnected(false);
            addToast('Connection error', 'error', 3000);
          }
          if (status === 'SUBSCRIBED') {
            await logAuditEvent('realtime_connected', {
              channel: 'calibrations',
            });
            setRealtimeConnected(true);
            updateLastSyncTime();
            addToast('Realtime sync active', 'success', 1500);
          }
          if (status === 'CLOSED') {
            await logAuditEvent('realtime_disconnected', {
              channel: 'calibrations',
            });
            setRealtimeConnected(false);
          }
        });
    };

    setupChannel();

    const handleOnline = () => {
      setupChannel();
      addToast('Back online - reconnecting 🔁', 'info', 2000);
    };

    const handleOffline = () => {
      setRealtimeConnected(false);
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
  }, [user, onInsert, onUpdate, onDelete, addToast, setRealtimeConnected, updateLastSyncTime]);
}

export function useRealtimeExperiments(
  onInsert?: (payload: unknown) => void,
  onUpdate?: (payload: unknown) => void,
  onDelete?: (payload: unknown) => void
) {
  const { user } = useAuth();
  const { addToast, setRealtimeConnected, updateLastSyncTime } = useUIStore();
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
              addToast('Analytics updated ✨', 'success', 2000);
            }

            updateLastSyncTime();
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
            setRealtimeConnected(false);
            addToast('Connection lost - retrying...', 'error', 3000);
          }
          if (status === 'SUBSCRIBED') {
            await logAuditEvent('realtime_connected', {
              channel: 'experiments',
            });
            setRealtimeConnected(true);
            updateLastSyncTime();
          }
          if (status === 'CLOSED') {
            await logAuditEvent('realtime_disconnected', {
              channel: 'experiments',
            });
            setRealtimeConnected(false);
          }
        });
    };

    setupChannel();

    const handleOnline = () => {
      setupChannel();
      addToast('Back online - reconnecting 🔁', 'info', 2000);
    };

    const handleOffline = () => {
      setRealtimeConnected(false);
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
  }, [user, onInsert, onUpdate, onDelete, addToast, setRealtimeConnected, updateLastSyncTime, computeSummary]);
}
