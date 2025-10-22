'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Filter,
  Calendar,
  Archive,
  Trash2,
  Save,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useDashboardStore } from '@/store/dashboard-store';
import { useAuth } from '@/lib/auth/auth-context';
import { useUIStore } from '@/store/ui-store';
import { supabase } from '@/lib/supabase/client';
import {
  exportUserData,
  exportFullUserData,
  discardExperiment,
  saveExperiment,
} from '@/lib/api/exports';
import { getAllCalibrations } from '@/lib/api/calibrations';
import { useRealtimeExperiments } from '@/lib/realtime/hooks';
import type { Database } from '@/lib/supabase/types';

// ✅ Lazy-loaded motion components for smaller initial bundles
import { MotionDiv } from '@/lib/lazy-motion';

type ExperimentRow = Database['public']['Tables']['experiments']['Row'];
type CalibrationRow = Database['public']['Tables']['calibrations']['Row'];

export default function DashboardPage() {
  const { user } = useAuth();
  const { addToast } = useUIStore();
  const {
    filteredExperiments,
    setExperiments,
    addExperiment,
    removeExperiment,
    updateExperiment,
    setLoading,
    isLoading,
    selectedExperiments,
    clearSelections,
    toggleExperimentSelection,
  } = useDashboardStore();

  const [calibrations, setCalibrations] = useState<CalibrationRow[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // ✅ FIXED: Hook signature simplified for TS compliance
  useRealtimeExperiments((payload: any) => {
    const eventType = payload.eventType || payload.type;

    switch (eventType) {
      case 'INSERT':
        addExperiment(payload.new as ExperimentRow);
        addToast('New experiment synced', 'success', 2000);
        break;

      case 'UPDATE':
        updateExperiment(
          (payload.new as ExperimentRow).id,
          payload.new as Partial<ExperimentRow>
        );
        break;

      case 'DELETE':
        removeExperiment((payload.old as ExperimentRow).id);
        addToast('Experiment removed', 'info', 2000);
        break;

      default:
        console.warn('Unhandled realtime event:', payload);
    }
  });

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
  if (!user) return; // ✅ added guard
  setLoading(true);
  try {
    const { data: experimentsData, error: experimentsError } = await supabase
      .from('experiments')
      .select('*')
      .order('created_at', { ascending: false });

    if (experimentsError) throw experimentsError;

    setExperiments(experimentsData || []);

    // ✅ safe — TS knows user is non-null
    const calibrationsData = await getAllCalibrations(user.id);
    setCalibrations(calibrationsData);
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
    addToast('Failed to load dashboard data', 'error');
  } finally {
    setLoading(false);
  }
};


  const handleExport = async (format: 'csv' | 'json') => {
    setIsExporting(true);
    try {
      if (selectedExperiments.length > 0) {
        await exportUserData(format, selectedExperiments);
        addToast(
          `Exported ${selectedExperiments.length} selected experiments (${format.toUpperCase()})`,
          'success'
        );
      } else {
        await exportUserData(format);
        addToast(`Exported all experiments (${format.toUpperCase()})`, 'success');
      }
    } catch {
      addToast('Export failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFullExport = async () => {
    setIsExporting(true);
    try {
      const fileName = await exportFullUserData();
      addToast(`Full export complete: ${fileName}`, 'success', 3000);
    } catch {
      addToast('Full export failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDiscard = async (id: string) => {
    try {
      await discardExperiment(id);
      updateExperiment(id, { discarded: true, saved: false });
      addToast('Experiment discarded', 'info');
    } catch {
      addToast('Failed to discard experiment', 'error');
    }
  };

  const handleSave = async (id: string) => {
    try {
      await saveExperiment(id);
      updateExperiment(id, { saved: true, discarded: false });
      addToast('Saved to Dashboard', 'success');
    } catch {
      addToast('Failed to save experiment', 'error');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Please sign in to view your dashboard</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="px-6 md:px-8 py-8">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#4A8FFF]/20 to-[#4A8FFF]/10 border border-[#4A8FFF]/30">
                <BarChart3 className="w-6 h-6 text-[#4A8FFF]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Research Dashboard
                </h1>
                <p className="text-gray-400 mt-1">
                  View and manage your experiment history
                </p>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>

              {selectedExperiments.length > 0 && (
                <Button
                  variant="secondary"
                  onClick={clearSelections}
                  className="text-gray-300 border border-gray-600 hover:bg-gray-800"
                >
                  Clear ({selectedExperiments.length})
                </Button>

              )}

              <Button
                onClick={handleFullExport}
                isLoading={isExporting}
                disabled={isExporting}
                className="bg-gradient-to-r from-[#4A8FFF] to-[#7B68EE] hover:opacity-90"
              >
                <Download className="w-4 h-4" />
                Full Export
              </Button>
              <Button
                onClick={() => handleExport('csv')}
                isLoading={isExporting}
                disabled={isExporting || filteredExperiments.length === 0}
              >
                <Download className="w-4 h-4" />
                {selectedExperiments.length > 0
                  ? `Export ${selectedExperiments.length} (CSV)`
                  : 'Export CSV'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleExport('json')}
                isLoading={isExporting}
                disabled={isExporting || filteredExperiments.length === 0}
              >
                <Download className="w-4 h-4" />
                {selectedExperiments.length > 0
                  ? `Export ${selectedExperiments.length} (JSON)`
                  : 'Export JSON'}
              </Button>
            </div>
          </div>
        </MotionDiv>

        {isLoading ? (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 border-4 border-[#4A8FFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading experiments...</p>
          </Card>
        ) : filteredExperiments.length === 0 ? (
          <Card className="p-12 text-center">
            <Archive className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              No experiments yet
            </h3>
            <p className="text-gray-500">
              Run experiments to see them appear here
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredExperiments.map((experiment, index) => (
              <ExperimentCard
                key={experiment.id}
                experiment={experiment}
                index={index}
                onDiscard={() => handleDiscard(experiment.id)}
                onSave={() => handleSave(experiment.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ExperimentCardProps {
  experiment: ExperimentRow;
  index: number;
  onDiscard: () => void;
  onSave: () => void;
}

function ExperimentCard({
  experiment,
  index,
  onDiscard,
  onSave,
}: ExperimentCardProps) {
  const { selectedExperiments, toggleExperimentSelection } = useDashboardStore();

  const params = experiment.parameters as {
    temperature?: number;
    topP?: number;
    maxTokens?: number;
  };

  const responses = experiment.responses as Array<unknown>;
  const responseCount = Array.isArray(responses) ? responses.length : 0;

  const isSelected = selectedExperiments.includes(experiment.id);

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        hoverable
        className={`p-6 cursor-pointer transition-all ${
          isSelected
            ? 'ring-2 ring-[#4A8FFF] bg-[#4A8FFF]/5'
            : 'hover:bg-white/5'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          toggleExperimentSelection(experiment.id);
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <button
                className="focus:outline-none"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExperimentSelection(experiment.id);
                }}
              >
                {isSelected ? (
                  <CheckSquare className="w-4 h-4 text-[#4A8FFF]" />
                ) : (
                  <Square className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {experiment.saved && (
                <span className="px-2 py-1 rounded-md bg-green-500/20 text-green-400 text-xs font-medium">
                  Saved
                </span>
              )}
              <span className="text-xs text-gray-400">
                <Calendar className="inline w-3 h-3 mr-1" />
                {experiment.created_at
                  ? new Date(experiment.created_at).toLocaleDateString()
                  : 'Unknown date'}

              </span>
            </div>

            <p className="text-white font-medium mb-2 line-clamp-2">
              {experiment.prompt}
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>T: {params.temperature?.toFixed(2)}</span>
              <span>P: {params.topP?.toFixed(2)}</span>
              <span>Tokens: {params.maxTokens}</span>
              <span>Responses: {responseCount}</span>
            </div>
          </div>

          <div className="flex gap-2 ml-4">
            {!experiment.saved && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSave();
                }}
              >
                <Save className="w-4 h-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="danger"
              onClick={(e) => {
                e.stopPropagation();
                onDiscard();
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4" />
            </Button>

          </div>
        </div>

        {isSelected && (
          <div className="pt-4 border-t border-white/10">
            <p className="text-sm text-gray-300 mb-2">Experiment Details</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">ID:</span>
                <span className="text-gray-300 ml-2">
                  {experiment.id.slice(0, 8)}...
                </span>
              </div>
              <div>
                <span className="text-gray-500">Calibration:</span>
                <span className="text-gray-300 ml-2">
                  {experiment.calibration_id
                    ? experiment.calibration_id.slice(0, 8) + '...'
                    : 'None'}
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>
    </MotionDiv>
  );
}
