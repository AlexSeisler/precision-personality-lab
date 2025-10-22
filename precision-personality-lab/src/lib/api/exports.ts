import { supabase } from '@/lib/supabase/client';
import { logAuditEvent } from './audit';

interface ExportData {
  id: string;
  prompt: string;
  parameters: Record<string, unknown>;
  responses: Array<unknown>;
  created_at: string;
  calibration_id: string | null;
}

function convertToCSV(data: ExportData[]): string {
  if (data.length === 0) return '';

  const headers = [
    'ID',
    'Prompt',
    'Temperature',
    'Top P',
    'Max Tokens',
    'Frequency Penalty',
    'Response Count',
    'Created At',
    'Calibration ID',
  ];

  const rows = data.map((exp) => {
    const params = exp.parameters as {
      temperature?: number;
      topP?: number;
      maxTokens?: number;
      frequencyPenalty?: number;
    };

    return [
      exp.id,
      `"${exp.prompt.replace(/"/g, '""')}"`,
      params.temperature ?? '',
      params.topP ?? '',
      params.maxTokens ?? '',
      params.frequencyPenalty ?? '',
      Array.isArray(exp.responses) ? exp.responses.length : 0,
      exp.created_at,
      exp.calibration_id ?? '',
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Export user experiments (optionally only selected ones)
 */
export async function exportUserData(
  format: 'csv' | 'json',
  selectedExperimentIds?: string[]
): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('No authenticated user');

    let query = supabase
      .from('experiments')
      .select('*')
      .eq('user_id', user.id)
      .eq('discarded', false)
      .order('created_at', { ascending: false });

    // ✅ If specific experiment IDs were provided, only export those
    if (selectedExperimentIds && selectedExperimentIds.length > 0) {
      query = query.in('id', selectedExperimentIds);
    }

    const { data: experiments, error } = await query;
    if (error) throw error;

    const exportData = experiments || [];
    const fileName = `precision_lab_export_${user.id.slice(0, 8)}_${Date.now()}.${format}`;

    let content: string;
    let mimeType: string;

    if (format === 'csv') {
      content = convertToCSV(exportData as ExportData[]);
      mimeType = 'text/csv';
    } else {
      content = JSON.stringify(exportData, null, 2);
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    await logAuditEvent('data_exported', {
      format,
      count: exportData.length,
      file_name: fileName,
      selected_count: selectedExperimentIds?.length ?? null,
    });

    return fileName;
  } catch (error) {
    console.error('Export failed:', error);
    const err = error as Error;
    await logAuditEvent('data_exported', { error: err.message, format });
    throw error;
  }
}

export async function discardExperiment(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('experiments')
      .update({ discarded: true, saved: false })
      .eq('id', id);

    if (error) throw error;

    await logAuditEvent('experiment_discarded', { experiment_id: id });
  } catch (error) {
    const err = error as Error;
    await logAuditEvent('experiment_discarded', {
      experiment_id: id,
      error: err.message,
    });
    throw error;
  }
}

export async function saveExperiment(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('experiments')
      .update({ saved: true, discarded: false })
      .eq('id', id);

    if (error) throw error;

    await logAuditEvent('experiment_saved', { experiment_id: id });
  } catch (error) {
    const err = error as Error;
    await logAuditEvent('experiment_saved', {
      experiment_id: id,
      error: err.message,
    });
    throw error;
  }
}

export async function exportFullUserData(): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('No authenticated user');

    const [experimentsResult, analyticsResult, auditsResult] = await Promise.all([
      supabase
        .from('experiments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('analytics_summaries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500),
    ]);

    if (experimentsResult.error) throw experimentsResult.error;
    if (analyticsResult.error) throw analyticsResult.error;
    if (auditsResult.error) throw auditsResult.error;

    const fullExport = {
      export_timestamp: new Date().toISOString(),
      user_id: user.id,
      user_email: user.email,
      data: {
        experiments: experimentsResult.data || [],
        analytics_summaries: analyticsResult.data || [],
        audit_logs: auditsResult.data || [],
      },
      metadata: {
        experiments_count: experimentsResult.data?.length || 0,
        analytics_count: analyticsResult.data?.length || 0,
        audit_logs_count: auditsResult.data?.length || 0,
      },
    };

    const content = JSON.stringify(fullExport, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const fileName = `precision-lab-full-export-${user.id.slice(0, 8)}-${Date.now()}.json`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    await logAuditEvent('data_exported_full', {
      format: 'json',
      experiments_count: fullExport.metadata.experiments_count,
      analytics_count: fullExport.metadata.analytics_count,
      audit_logs_count: fullExport.metadata.audit_logs_count,
      file_name: fileName,
    });

    return fileName;
  } catch (error) {
    console.error('Full export failed:', error);
    const err = error as Error;
    await logAuditEvent('data_exported_full', { error: err.message });
    throw error;
  }
}
