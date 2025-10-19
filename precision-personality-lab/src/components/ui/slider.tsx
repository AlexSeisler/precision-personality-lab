'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  description?: string;
  color?: 'blue' | 'orange' | 'purple';
}

export function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  description,
  color = 'blue',
}: SliderProps) {
  const [isFocused, setIsFocused] = useState(false);

  const percentage = ((value - min) / (max - min)) * 100;

  const colorClasses = {
    blue: {
      track: 'from-[#4A8FFF] to-[#3A7FEF]',
      thumb: 'border-[#4A8FFF] shadow-[#4A8FFF]/50',
      glow: 'shadow-[0_0_20px_rgba(74,143,255,0.4)]',
    },
    orange: {
      track: 'from-[#FF7E47] to-[#EF6E37]',
      thumb: 'border-[#FF7E47] shadow-[#FF7E47]/50',
      glow: 'shadow-[0_0_20px_rgba(255,126,71,0.4)]',
    },
    purple: {
      track: 'from-purple-500 to-purple-600',
      thumb: 'border-purple-500 shadow-purple-500/50',
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.4)]',
    },
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <motion.span
          key={value}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className="text-sm font-mono font-semibold text-white bg-white/5 px-2 py-1 rounded"
        >
          {value.toFixed(step < 1 ? 2 : 0)}
        </motion.span>
      </div>

      <div className="relative">
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className={`h-full bg-gradient-to-r ${colorClasses[color].track}`}
            style={{ width: `${percentage}%` }}
            initial={false}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
          aria-label={label}
        />

        <motion.div
          className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 ${
            colorClasses[color].thumb
          } ${isFocused ? colorClasses[color].glow : ''} pointer-events-none`}
          style={{ left: `calc(${percentage}% - 8px)` }}
          animate={{
            scale: isFocused ? 1.3 : 1,
          }}
          transition={{ duration: 0.15 }}
        />
      </div>

      {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
    </div>
  );
}
