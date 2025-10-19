'use client';

import { Settings2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import type { ExperimentParameters } from '@/types';

interface ParameterControlsProps {
  parameters: ExperimentParameters;
  onChange: (key: keyof ExperimentParameters, value: number) => void;
}

export function ParameterControls({ parameters, onChange }: ParameterControlsProps) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings2 className="w-5 h-5 text-[#FF7E47]" />
        <h3 className="text-lg font-bold text-white">Model Parameters</h3>
      </div>

      <div className="space-y-6">
        <Slider
          label="Temperature"
          value={parameters.temperature}
          onChange={(value) => onChange('temperature', value)}
          min={0}
          max={2}
          step={0.1}
          description="Controls randomness. Higher = more creative"
          color="orange"
        />

        <Slider
          label="Top P"
          value={parameters.topP}
          onChange={(value) => onChange('topP', value)}
          min={0}
          max={1}
          step={0.05}
          description="Nucleus sampling. Lower = more focused"
          color="blue"
        />

        <Slider
          label="Max Tokens"
          value={parameters.maxTokens}
          onChange={(value) => onChange('maxTokens', value)}
          min={100}
          max={4000}
          step={100}
          description="Maximum response length"
          color="purple"
        />

        <Slider
          label="Frequency Penalty"
          value={parameters.frequencyPenalty}
          onChange={(value) => onChange('frequencyPenalty', value)}
          min={0}
          max={2}
          step={0.1}
          description="Reduces repetition of words"
          color="blue"
        />

        <Slider
          label="Presence Penalty"
          value={parameters.presencePenalty}
          onChange={(value) => onChange('presencePenalty', value)}
          min={0}
          max={2}
          step={0.1}
          description="Encourages new topics"
          color="orange"
        />
      </div>
    </div>
  );
}
