'use client';

import React from 'react';
import { Message } from '../../types';
import { PromptInjectionAlert } from './PromptInjectionAlert';
import { Badge } from '../ui/Badge';
import { User as UserIcon, Bot, Cpu, Terminal } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isTool = message.role === 'tool';
  const promptInjection = message.metadata?.promptInjectionDetected;

  return (
    <div className={`flex gap-3 my-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Role Avatar */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
          isUser
            ? 'bg-cyan-950 border-cyan-500/40 text-cyan-300'
            : isAssistant
            ? 'bg-purple-950 border-purple-500/40 text-purple-300'
            : 'bg-slate-800 border-slate-700 text-slate-300'
        }`}
      >
        {isUser ? (
          <UserIcon className="w-4 h-4" />
        ) : isAssistant ? (
          <Bot className="w-4 h-4" />
        ) : isTool ? (
          <Terminal className="w-4 h-4" />
        ) : (
          <Cpu className="w-4 h-4" />
        )}
      </div>

      {/* Bubble Content */}
      <div className={`max-w-[80%] ${isUser ? 'text-right' : 'text-left'}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-semibold text-slate-400 capitalize">{message.role}</span>
          {message.createdAt && (
            <span className="text-[10px] text-slate-500 font-mono">
              {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {promptInjection && (
          <PromptInjectionAlert patterns={message.metadata?.matchedPatterns} />
        )}

        <div
          className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap border ${
            isUser
              ? 'bg-gradient-to-r from-cyan-950/80 to-indigo-950/80 border-cyan-500/30 text-white rounded-tr-none shadow-md shadow-cyan-950/20'
              : 'bg-slate-900/90 border-slate-800 text-slate-200 rounded-tl-none shadow-md backdrop-blur-md'
          }`}
        >
          {message.content}

          {message.isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse rounded-xs" />
          )}
        </div>

        {/* Tool Call Badges */}
        {message.metadata?.toolCall && (
          <div className="mt-1.5 flex gap-1.5">
            <Badge variant="indigo" size="sm">
              <Terminal className="w-3 h-3" />
              Tool: {message.metadata.toolCall.name}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
};
