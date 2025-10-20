import { useEffect } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { useUIStore } from '@/store/ui-store';
import { logAuditEvent } from '@/lib/api/audit-logs';

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
          (payload) => {
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
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            logAuditEvent(user.id, 'realtime_connected', {
              channel: 'calibrations',
            });
          }
        });
    };

    setupChannel();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
        logAuditEvent(user.id, 'realtime_disconnected', {
          channel: 'calibrations',
        });
      }
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
          (payload) => {
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
          (payload) => {
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
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            logAuditEvent(user.id, 'realtime_connected', {
              channel: 'experiments',
            });
          }
        });
    };

    setupChannel();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
        logAuditEvent(user.id, 'realtime_disconnected', {
          channel: 'experiments',
        });
      }
    };
  }, [user, onInsert, onUpdate, onDelete, addToast]);
}
