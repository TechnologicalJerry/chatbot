'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface PromptInjectionAlertProps {
  patterns?: string[];
}

export const PromptInjectionAlert: React.FC<PromptInjectionAlertProps> = ({ patterns }) => {
  return (
    <div className="flex items-start gap-2.5 p-3 mb-2 bg-rose-950/70 border border-rose-800/80 rounded-xl text-rose-300 text-xs">
      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
      <div>
        <div className="font-semibold text-rose-200">Security Warning: Prompt Injection Pattern Flagged</div>
        <p className="text-[11px] text-rose-400 mt-0.5">
          This message triggered security scanner filters. Input has been sanitized before sending to LLM.
        </p>
        {patterns && patterns.length > 0 && (
          <div className="mt-1 font-mono text-[10px] text-rose-400/80">
            Matched Rules: {patterns.join(', ')}
          </div>
        )}
      </div>
    </div>
  );
};
