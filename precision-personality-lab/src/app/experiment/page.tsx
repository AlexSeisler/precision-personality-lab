'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, Sparkles, Loader2, Download, Sliders } from "lucide-react";
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

  const { isCalibrated, parameterRanges, currentCalibrationId } = useCalibrationStore();
  const { addToast } = useUIStore();
  const { computeSummary } = useMetricsStore();

  // 🆕 Add local state for multi-response count
  const [responseCount, setResponseCount] = useState(1);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [hasLoadedCalibration, setHasLoadedCalibration] = useState(false);

  // Load calibration defaults on mount
  useEffect(() => {
    if (isCalibrated && parameterRanges && !hasLoadedCalibration) {
      const midTemp = (parameterRanges.temperature.min + parameterRanges.temperature.max) / 2;
      const midTopP = (parameterRanges.topP.min + parameterRanges.topP.max) / 2;
      const midTokens = Math.round((parameterRanges.maxTokens.min + parameterRanges.maxTokens.max) / 2);
      const midFreq = (parameterRanges.frequencyPenalty.min + parameterRanges.frequencyPenalty.max) / 2;

      setParameter('temperature', midTemp);
      setParameter('topP', midTopP);
      setParameter('maxTokens', midTokens);
      setParameter('frequencyPenalty', midFreq);

      setHasLoadedCalibration(true);
      addToast('✨ Calibration settings loaded from previous session', 'info', 4000);
    }
  }, [isCalibrated, parameterRanges, hasLoadedCalibration, setParameter, addToast]);

  // --- Handle generation ---
  const handleGenerate = async () => {
    if (!currentPrompt.trim()) {
      addToast('Please enter a prompt before generating', 'warning');
      return;
    }

    if (!currentCalibrationId) {
      addToast('No calibration found. Please complete calibration first.', 'error');
      router.push('/calibration');
      return;
    }

    setGenerating(true);
    addToast('Generating response...', 'info');

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        addToast('Authentication required', 'error');
        setGenerating(false);
        return;
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          prompt: currentPrompt,
          calibrationId: currentCalibrationId,
          parameters: currentParameters,
          responseCount, // 🆕 send response count to backend
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
      addToast(error instanceof Error ? error.message : 'Failed to generate response', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // --- Reset experiment ---
  const handleReset = () => {
    setPrompt('');
    setResponses([]);
    addToast('Experiment reset', 'info');
  };

  // Reset "Generating..." if prompt changes
  useEffect(() => {
    setGenerating(false);
  }, [currentPrompt]);

  return (
    <div className="w-full">
      <div className="px-6 md:px-8">
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

          <div className="flex gap-2">
            {isCalibrated && (
              <Button
                onClick={() => router.push('/calibration')}
                className="bg-gradient-to-r from-[#4A8FFF] to-[#FF7E47] text-white hover:brightness-110 transition-all"
              >
                <Sliders className="w-4 h-4" />
                Recalibrate
              </Button>
            )}
            {currentResponses.length > 0 && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setIsExportModalOpen(true)}
                >
                  <Download className="w-4 h-4" />
                  Export Data
                </Button>
                <Button variant="ghost" onClick={handleReset}>
                  Reset Experiment
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <PromptInput
              value={currentPrompt}
              onChange={setPrompt}
              placeholder="Enter your prompt here... Try asking about AI, science, creativity, or any topic!"
            />

            <Card className="p-6 space-y-4">
              {/* 🆕 Response Count Selector */}
              <div className="flex justify-center gap-2 mb-2">
                {[1, 3, 5, 20, 100].map((count) => {
                  const disabled = count > 5; // lock 20/100 for normal users
                  return (
                    <Button
                      key={count}
                      variant={count === responseCount ? "default" : "outline"}
                      disabled={disabled}
                      onClick={() => setResponseCount(count)}
                      className={`w-12 text-sm ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {count}
                    </Button>
                  );
                })}
              </div>

              <Button
                onClick={handleGenerate}
                isLoading={isGenerating}
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


            {currentResponses.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h2 className="text-2xl font-bold text-white">Responses</h2>
                {currentResponses.map((response, index) => (
                  <ResponseCard key={response.id} response={response} index={index} />
                ))}
              </motion.div>
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
    </div>
  );
}

interface ResponseCardProps {
  response: any;
  index: number;
}

function ResponseCard({ response, index }: ResponseCardProps) {
  return (
    <motion.div
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
              <h3 className="font-semibold text-white">Response {index + 1}</h3>
              <p className="text-xs text-gray-400">
                T: {response.parameters.temperature.toFixed(1)} | P: {response.parameters.topP.toFixed(2)}
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
    </motion.div>
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
