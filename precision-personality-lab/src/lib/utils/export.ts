import type { Experiment, LLMResponse } from '@/types';

export function exportToCSV(responses: LLMResponse[]): string {
  const headers = [
    'ID',
    'Timestamp',
    'Prompt',
    'Response Text',
    'Temperature',
    'Top P',
    'Max Tokens',
    'Frequency Penalty',
    'Presence Penalty',
    'Length',
    'Completeness',
    'Coherence',
    'Structure',
    'Lexical Diversity',
    'Creativity',
  ];

  const rows = responses.map((response) => [
    response.id,
    new Date(response.timestamp).toISOString(),
    `"${response.prompt.replace(/"/g, '""')}"`,
    `"${response.text.replace(/"/g, '""')}"`,
    response.parameters.temperature,
    response.parameters.topP,
    response.parameters.maxTokens,
    response.parameters.frequencyPenalty,
    response.parameters.presencePenalty,
    response.metrics.length,
    response.metrics.completeness.toFixed(2),
    response.metrics.coherence.toFixed(2),
    response.metrics.structure.toFixed(2),
    response.metrics.lexicalDiversity.toFixed(2),
    response.metrics.creativity.toFixed(2),
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

export function exportToJSON(responses: LLMResponse[]): string {
  return JSON.stringify(
    {
      exportDate: new Date().toISOString(),
      responseCount: responses.length,
      responses: responses.map((r) => ({
        id: r.id,
        timestamp: r.timestamp,
        prompt: r.prompt,
        text: r.text,
        parameters: r.parameters,
        metrics: r.metrics,
      })),
    },
    null,
    2
  );
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportExperiment(
  responses: LLMResponse[],
  format: 'csv' | 'json'
): void {
  const timestamp = new Date().toISOString().slice(0, 10);

  if (format === 'csv') {
    const csv = exportToCSV(responses);
    downloadFile(csv, `experiment-${timestamp}.csv`, 'text/csv');
  } else {
    const json = exportToJSON(responses);
    downloadFile(json, `experiment-${timestamp}.json`, 'application/json');
  }
}
