'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileJson, FileText, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { exportExperiment } from '@/lib/utils/export';
import { useUIStore } from '@/store/ui-store';
import type { LLMResponse } from '@/types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  responses: LLMResponse[];
}

export function ExportModal({ isOpen, onClose, responses }: ExportModalProps) {
  const { addToast } = useUIStore();
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json'>('json');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (responses.length === 0) {
      addToast('No responses to export', 'warning');
      return;
    }

    setIsExporting(true);

    setTimeout(() => {
      exportExperiment(responses, selectedFormat);
      addToast(
        `Successfully exported ${responses.length} response${responses.length > 1 ? 's' : ''} as ${selectedFormat.toUpperCase()}`,
        'success'
      );
      setIsExporting(false);
      onClose();
    }, 500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Experiment Data" size="md">
      <div className="space-y-6">
        <p className="text-gray-300">
          Choose a format to export your {responses.length} response{responses.length > 1 ? 's' : ''} and
          experiment data.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <FormatOption
            format="json"
            icon={<FileJson className="w-8 h-8" />}
            title="JSON"
            description="Structured data with full metadata"
            isSelected={selectedFormat === 'json'}
            onClick={() => setSelectedFormat('json')}
          />

          <FormatOption
            format="csv"
            icon={<FileText className="w-8 h-8" />}
            title="CSV"
            description="Spreadsheet-compatible table format"
            isSelected={selectedFormat === 'csv'}
            onClick={() => setSelectedFormat('csv')}
          />
        </div>

        <div className="glass-card p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-white mb-2">Export Preview</h4>
          <div className="space-y-1 text-sm text-gray-400">
            <p>• {responses.length} response{responses.length > 1 ? 's' : ''}</p>
            <p>• Parameter configurations</p>
            <p>• Computed metrics (creativity, coherence, structure)</p>
            <p>• Timestamps and metadata</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <Button variant="ghost" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>

          <Button onClick={handleExport} isLoading={isExporting} disabled={isExporting}>
            <Download className="w-4 h-4" />
            Export {selectedFormat.toUpperCase()}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface FormatOptionProps {
  format: 'csv' | 'json';
  icon: React.ReactNode;
  title: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}

function FormatOption({
  format,
  icon,
  title,
  description,
  isSelected,
  onClick,
}: FormatOptionProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative p-6 rounded-xl text-left transition-all
        ${
          isSelected
            ? 'bg-[#4A8FFF]/20 border-2 border-[#4A8FFF]'
            : 'bg-white/5 border-2 border-white/10 hover:bg-white/10 hover:border-white/20'
        }
      `}
    >
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3"
        >
          <CheckCircle2 className="w-5 h-5 text-[#4A8FFF]" />
        </motion.div>
      )}

      <div
        className={`mb-3 ${
          isSelected ? 'text-[#4A8FFF]' : 'text-gray-400'
        }`}
      >
        {icon}
      </div>

      <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </motion.button>
  );
}
