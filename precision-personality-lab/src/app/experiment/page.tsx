'use client';

import { useState, useEffect, useRef } from 'react';
import {
  FlaskConical,
  Sparkles,
  Loader2,
  Download,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PromptInput } from '@/components/features/prompt-input';
import { ParameterControls } from '@/components/features/parameter-controls';
import { ExportModal } from '@/components/features/export-modal';
import { useExperimentStore } from '@/store/experiment-store';
import { useCalibrationStore } from '@/store/calibration-store';
import { useUIStore } from '@/store/ui-store';
import { useMetricsStore } from '@/store/metrics-store';
import { supabase } from '@/lib/supabase/client';

// ✅ Updated import — lazy-loaded motion components
import { MotionDiv } from '@/lib/lazy-motion';

// ✅ Extend parameterRanges type locally to fix TS
type ParameterRangeExtended = {
  temperature: { min: number; max: number };
  topP: { min: number; max: number };
  maxTokens: { min: number; max: number };
  frequencyPenalty: { min: number; max: number };
  presencePenalty?: { min: number; max: number }; // added missing field
};

export default function ExperimentPage() {
  const router = useRouter();
  const {
    currentPrompt,
    currentParameters,
    currentResponses,
    isGenerating,
    setPrompt,
    setParameter,
    setResponses,
    setGenerating,
  } = useExperimentStore();

  const {
    isCalibrated,
    parameterRanges,
    currentCalibrationId,
  } = useCalibrationStore() as { // ✅ cast fixes typing safely
    isCalibrated: boolean;
    parameterRanges: ParameterRangeExtended;
    currentCalibrationId: string | null;
  };

  const { addToast } = useUIStore();
  const { computeSummary } = useMetricsStore();

  const [responseCount, setResponseCount] = useState(1);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [hasLoadedCalibration, setHasLoadedCalibration] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isRecalibrating, setIsRecalibrating] = useState(false);

  const calibrationToastShown = useRef(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (
        isCalibrated &&
        parameterRanges &&
        !hasLoadedCalibration &&
        !calibrationToastShown.current
      ) {
        const midTemp =
          (parameterRanges.temperature.min + parameterRanges.temperature.max) / 2;
        const midTopP =
          (parameterRanges.topP.min + parameterRanges.topP.max) / 2;
        const midTokens = Math.round(
          (parameterRanges.maxTokens.min + parameterRanges.maxTokens.max) / 2
        );
        const midFreq =
          (parameterRanges.frequencyPenalty.min +
            parameterRanges.frequencyPenalty.max) /
          2;
        const midPresence =
          ((parameterRanges.presencePenalty?.min ?? 0) +
            (parameterRanges.presencePenalty?.max ?? 0)) /
          2;

        setParameter('temperature', midTemp);
        setParameter('topP', midTopP);
        setParameter('maxTokens', midTokens);
        setParameter('frequencyPenalty', midFreq);
        setParameter('presencePenalty', midPresence);

        setHasLoadedCalibration(true);
        addToast('✨ Calibration settings loaded from previous session', 'info', 4000);
        calibrationToastShown.current = true;
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [isCalibrated, parameterRanges, hasLoadedCalibration, setParameter, addToast]);


  const handleGenerate = async () => {
    if (!currentPrompt.trim()) {
      addToast('Please enter a prompt before generating', 'warning');
      return;
    }

    if (!currentCalibrationId) {
      addToast('No calibration found. Please complete calibration first.', 'error');
      router.prefetch("/calibration");
      router.push('/calibration');
      return;
    }

    setGenerating(true);
    addToast('Generating response...', 'info');

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        addToast('Authentication required', 'error');
        setGenerating(false);
        return;
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          prompt: currentPrompt,
          calibrationId: currentCalibrationId,
          parameters: currentParameters,
          responseCount,
        }),
      });

      const result = await response.json();
      console.log('[LLM DEBUG] API result:', result);

      if (!response.ok) {
        throw new Error(result?.message || `Generation failed: ${response.status}`);
      }

      const experiment = result.data?.experiment;
      if (experiment?.responses?.length) {
        setResponses(experiment.responses);
        await computeSummary(experiment.responses, currentCalibrationId);
        addToast('Response generated successfully!', 'success');
      } else {
        addToast('No responses returned from model', 'warning');
      }
    } catch (error) {
      console.error('Generation error:', error);
      addToast(
        error instanceof Error ? error.message : 'Failed to generate response',
        'error'
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = () => {
    setPrompt('');
    setResponses([]);
    addToast('Experiment reset', 'info');
  };

  const handleRecalibrateConfirm = async () => {
    setIsRecalibrating(true);
    try {
      await new Promise((res) => setTimeout(res, 400));
      router.push('/calibration');
    } finally {
      setIsRecalibrating(false);
      setShowConfirm(false);
    }
  };

  useEffect(() => {
    setGenerating(false);
  }, [currentPrompt]);

  return (
    <div className="w-full">
      <div className="px-6 md:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#FF7E47]/20 to-[#EF6E37]/10 border border-[#FF7E47]/30">
              <FlaskConical className="w-6 h-6 text-[#FF7E47]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white glow-orange">
                Experiment Studio
              </h1>
              <p className="text-gray-400 mt-1">
                Run controlled experiments with different parameter sets
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap justify-end">
            {/* ✅ Always show calibration button */}
            {isCalibrated ? (
              <Button
                onClick={() => setShowConfirm(true)}
                className="bg-gradient-to-r from-[#4A8FFF] to-[#FF7E47] text-white hover:brightness-110 transition-all"
              >
                <Sliders className="w-4 h-4 mr-1" />
                Recalibrate
              </Button>
            ) : (
              <Button
                onClick={() => router.push('/calibration')}
                className="bg-gradient-to-r from-[#4A8FFF] to-[#FF7E47] text-white hover:brightness-110 transition-all"
              >
                <Sliders className="w-4 h-4 mr-1" />
                Calibrate
              </Button>
            )}

            <Button
              variant="secondary"
              onClick={() => setIsExportModalOpen(true)}
              disabled={currentResponses.length === 0}
            >
              <Download className="w-4 h-4 mr-1" />
              Export Data
            </Button>

            <Button variant="ghost" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset Experiment
            </Button>
          </div>
        </div>


        {/* --- Main content --- */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <PromptInput
              value={currentPrompt}
              onChange={setPrompt}
              placeholder="Enter your prompt here... Try asking about AI, science, creativity, or any topic!"
            />

            <Card className="p-6 space-y-4">
              <div className="flex justify-center gap-2 mb-2">
                {[1, 3, 5, 20, 100].map((count) => {
                  const disabled = count > 5;
                  return (
                    <Button
                      key={count}
                      variant={count === responseCount ? 'primary' : 'secondary'}
                      disabled={disabled}
                      onClick={() => setResponseCount(count)}
                      className={`w-12 text-sm ${
                        count !== responseCount ? 'border border-gray-600 bg-transparent' : ''
                      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {count}
                    </Button>

                  );
                })}
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !currentPrompt.trim()}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Response
                  </>
                )}
              </Button>

            </Card>

            {/* ✅ motion.div → MotionDiv */}
            {currentResponses.length > 0 && (
              <MotionDiv
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h2 className="text-2xl font-bold text-white">Responses</h2>
                {currentResponses.map((response, index) => (
                  <ResponseCard key={response.id} response={response} index={index} />
                ))}
              </MotionDiv>
            )}

            {currentResponses.length === 0 && !isGenerating && (
              <Card className="p-12 text-center">
                <Sparkles className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">
                  No responses yet
                </h3>
                <p className="text-gray-500">
                  Enter a prompt and adjust parameters to generate responses
                </p>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <ParameterControls
              parameters={currentParameters}
              onChange={setParameter}
            />
          </div>
        </div>
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        responses={currentResponses}
      />

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6 text-white animate-fade-in">
            <h2 className="text-xl font-semibold mb-2">Recalibrate Model</h2>
            <p className="text-gray-400 mb-6">
              Recalibrating will clear current parameters and open the calibration console.
            </p>

            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowConfirm(false)}
                className="bg-gray-700 hover:bg-gray-600 text-gray-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRecalibrateConfirm}
                disabled={isRecalibrating}
                className="bg-gradient-to-r from-[#4A8FFF] to-[#7B68EE] hover:opacity-90"
              >
                {isRecalibrating ? 'Recalibrating...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ResponseCardProps {
  response: any;
  index: number;
}

function ResponseCard({ response, index }: ResponseCardProps) {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card hoverable className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full gradient-precision flex items-center justify-center text-white font-bold text-sm">
              {index + 1}
            </div>
            <div>
              <h3 className="font-semibold text-white">
                Response {index + 1}{' '}
                {response.parameters.variationType === 'exact'
                  ? '🎯 Exact'
                  : '🔀 Varied'}
              </h3>
              <p className="text-xs text-gray-400">
                T: {response.parameters.temperature.toFixed(1)} | P:{' '}
                {response.parameters.topP.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <p className="text-gray-300 leading-relaxed mb-4 whitespace-pre-wrap">
          {response.text}
        </p>

        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
          <MetricBadge label="Creativity" value={response.metrics.creativity} color="orange" />
          <MetricBadge label="Coherence" value={response.metrics.coherence} color="blue" />
          <MetricBadge label="Structure" value={response.metrics.structure} color="purple" />
        </div>
      </Card>
    </MotionDiv>
  );
}

interface MetricBadgeProps {
  label: string;
  value: number;
  color: 'blue' | 'orange' | 'purple';
}

function MetricBadge({ label, value, color }: MetricBadgeProps) {
  const colorClasses = {
    blue: 'bg-[#4A8FFF]/10 text-[#4A8FFF] border-[#4A8FFF]/30',
    orange: 'bg-[#FF7E47]/10 text-[#FF7E47] border-[#FF7E47]/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  };

  return (
    <div className={`px-3 py-2 rounded-lg border ${colorClasses[color]}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-lg font-bold">{value.toFixed(0)}</p>
    </div>
  );
}
