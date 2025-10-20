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

export async function exportUserData(
  format: 'csv' | 'json'
): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('No authenticated user');
    }

    const { data: experiments, error } = await supabase
      .from('experiments')
      .select('*')
      .eq('user_id', user.id)
      .eq('discarded', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const exportData = experiments || [];

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
    const fileName = `precision_lab_export_${user.id.slice(0, 8)}_${Date.now()}.${format}`;

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
