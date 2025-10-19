'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function PromptInput({ value, onChange, placeholder }: PromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <div className="glass-card p-6">
      <label className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
        <Sparkles className="w-4 h-4 text-[#4A8FFF]" />
        Prompt
      </label>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Describe your idea or ask a question...'}
        className="w-full min-h-[120px] max-h-[400px] p-4 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#4A8FFF] focus:ring-2 focus:ring-[#4A8FFF]/20 resize-none transition-all"
        rows={4}
      />

      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-500">
          {value.length} characters
        </p>
        {value.length > 500 && (
          <p className="text-xs text-yellow-400">
            Long prompts may affect generation quality
          </p>
        )}
      </div>
    </div>
  );
}
