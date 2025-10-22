'use client';

import { Settings2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import type { ExperimentParameters } from '@/types';

interface ParameterControlsProps {
  parameters: ExperimentParameters;
  onChange: (key: keyof ExperimentParameters, value: number) => void;
}

export function ParameterControls({ parameters, onChange }: ParameterControlsProps) {
  const handleSliderChange = (key: keyof ExperimentParameters, value: number) => {
    const rounded = Number(value.toFixed(2));
    console.log(`[PARAM DEBUG] ${key} updated →`, rounded);
    onChange(key, rounded);
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings2 className="w-5 h-5 text-[#FF7E47]" />
        <h3 className="text-lg font-bold text-white">Model Parameters</h3>
      </div>

      <div className="space-y-8">
        {/* Temperature */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm text-gray-300 font-medium">Temperature</label>
            <span className="text-gray-400 font-mono">
              {parameters.temperature.toFixed(2)}
            </span>
          </div>
          <Slider
            label="Temperature"
            value={parameters.temperature}
            onChange={(v) => handleSliderChange('temperature', v)}
            min={0}
            max={1.5}
            step={0.05}
            description="Controls randomness. Higher = more creative."
            color="orange"
          />
        </div>

        {/* Top P */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm text-gray-300 font-medium">Top P</label>
            <span className="text-gray-400 font-mono">
              {parameters.topP.toFixed(2)}
            </span>
          </div>
          <Slider
            label="Top P"
            value={parameters.topP}
            onChange={(v) => handleSliderChange('topP', v)}
            min={0.1}
            max={1}
            step={0.05}
            description="Nucleus sampling. Lower = more focused."
            color="blue"
          />
        </div>

        {/* Max Tokens */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm text-gray-300 font-medium">Max Tokens</label>
            <span className="text-gray-400 font-mono">{parameters.maxTokens}</span>
          </div>
          <Slider
            label="Max Tokens"
            value={parameters.maxTokens}
            onChange={(v) => handleSliderChange('maxTokens', v)}
            min={100}
            max={4000}
            step={50}
            description="Maximum response length."
            color="purple"
          />
        </div>

        {/* Frequency Penalty */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm text-gray-300 font-medium">
              Frequency Penalty
            </label>
            <span className="text-gray-400 font-mono">
              {parameters.frequencyPenalty.toFixed(2)}
            </span>
          </div>
          <Slider
            label="Frequency Penalty"
            value={parameters.frequencyPenalty}
            onChange={(v) => handleSliderChange('frequencyPenalty', v)}
            min={0}
            max={2}
            step={0.1}
            description="Reduces repetition of words."
            color="blue"
          />
        </div>

        {/* Presence Penalty */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm text-gray-300 font-medium">Presence Penalty</label>
            <span className="text-gray-400 font-mono">
              {parameters.presencePenalty.toFixed(2)}
            </span>
          </div>
          <Slider
            label="Presence Penalty"
            value={parameters.presencePenalty}
            onChange={(v) => handleSliderChange('presencePenalty', v)}
            min={0}
            max={2}
            step={0.1}
            description="Encourages new topics."
            color="orange"
          />
        </div>
      </div>
    </div>
  );
}
