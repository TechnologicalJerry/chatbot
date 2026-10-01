'use client';

import React, { useState } from 'react';
import { Send, Zap, Radio } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string, model: string, useStreaming: boolean) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
  const [text, setText] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [useStreaming, setUseStreaming] = useState(true);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || disabled) return;
    onSendMessage(text.trim(), model, useStreaming);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-slate-950/90 border-t border-slate-800/80">
      <div className="flex items-center justify-between gap-3 mb-2 px-1 text-xs">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="bg-slate-900 text-slate-300 border border-slate-800 rounded-lg px-2 py-1 focus:outline-none text-xs"
          >
            <option value="gpt-4o-mini">gpt-4o-mini (Fast)</option>
            <option value="gpt-4o">gpt-4o (High Intelligence)</option>
            <option value="mock-engine">Mock Engine (Offline)</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setUseStreaming(!useStreaming)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono transition-all border ${
            useStreaming
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}
        >
          <Radio className={`w-3 h-3 ${useStreaming ? 'animate-pulse text-emerald-400' : ''}`} />
          <span>SSE Stream: {useStreaming ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      <div className="relative flex items-center">
        <textarea
          rows={2}
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything... (Press Enter to send, Shift+Enter for new line)"
          className="w-full py-3 pl-4 pr-12 text-sm text-white bg-slate-900/90 border border-slate-800 rounded-2xl focus:outline-none focus:border-cyan-500/80 resize-none shadow-inner"
        />

        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="absolute right-3 p-2 text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-md shadow-cyan-500/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};
