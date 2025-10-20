'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical as Flask, Sparkles, Loader2, Download } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PromptInput } from '@/components/features/prompt-input';
import { ParameterControls } from '@/components/features/parameter-controls';
import { ExportModal } from '@/components/features/export-modal';
import { useExperimentStore } from '@/store/experiment-store';
import { useUIStore } from '@/store/ui-store';
import { generateMultipleResponses } from '@/lib/mock-data/response-generator';

export default function ExperimentPage() {
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

  const { addToast } = useUIStore();
  const [responseCount, setResponseCount] = useState(3);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleGenerate = async () => {
    if (!currentPrompt.trim()) {
      addToast('Please enter a prompt before generating', 'warning');
      return;
    }

    setGenerating(true);
    addToast('Generating responses...', 'info', 2000);

    setTimeout(() => {
      const responses = generateMultipleResponses(
        currentPrompt,
        currentParameters,
        responseCount
      );

      setResponses(responses);
      setGenerating(false);
      addToast(`Generated ${responses.length} responses successfully!`, 'success');
    }, 2000);
  };

  const handleReset = () => {
    setPrompt('');
    setResponses([]);
    addToast('Experiment reset', 'info');
  };

  return (
    <div className="min-h-screen py-8">
      <div className="px-6 md:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#FF7E47]/20 to-[#EF6E37]/10 border border-[#FF7E47]/30">
              <Flask className="w-6 h-6 text-[#FF7E47]" />
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

          {currentResponses.length > 0 && (
            <div className="flex gap-2">
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
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <PromptInput
              value={currentPrompt}
              onChange={setPrompt}
              placeholder="Enter your prompt here... Try asking about AI, science, creativity, or any topic!"
            />

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-semibold text-white">
                  Number of Responses
                </label>
                <select
                  value={responseCount}
                  onChange={(e) => setResponseCount(Number(e.target.value))}
                  className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#4A8FFF]"
                >
                  <option value={1}>1 Response</option>
                  <option value={3}>3 Responses</option>
                  <option value={5}>5 Responses</option>
                </select>
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
                    Generate Responses
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

        <p className="text-gray-300 leading-relaxed mb-4">{response.text}</p>

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
