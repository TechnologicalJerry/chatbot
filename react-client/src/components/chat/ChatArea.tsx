'use client';

import React, { useRef, useEffect } from 'react';
import { Conversation, Message } from '../../types';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { useServer } from '../../context/ServerContext';
import { Sparkles, MessageSquare, Server } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface ChatAreaProps {
  conversation: Conversation | null;
  messages: Message[];
  onSendMessage: (message: string, model: string, useStreaming: boolean) => void;
  isLoading: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  messages,
  onSendMessage,
  isLoading,
}) => {
  const { activeServer } = useServer();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!conversation) {
    return (
      <div className="flex-1 h-screen flex flex-col items-center justify-center p-8 bg-slate-950 text-center">
        <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl mb-4">
          <Sparkles className="w-12 h-12 text-cyan-400 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Welcome to AI Chatbot OS</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          Connect seamlessly to Express, Nest.js, or Fastify backends with real-time SSE streaming, vector RAG, and long-term memory.
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="cyan" size="md">
            <Server className="w-3.5 h-3.5" />
            Active Target: {activeServer.name} (:{activeServer.port})
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-screen flex flex-col bg-slate-950">
      {/* Header */}
      <div className="px-6 py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white truncate max-w-xs">{conversation.title}</h2>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="cyan" size="sm">
            <Server className="w-3 h-3" />
            {activeServer.name}
          </Badge>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-2">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">
            No messages in this conversation yet. Type your query below!
          </div>
        ) : (
          messages.map((msg, index) => (
            <MessageBubble key={msg._id || index} message={msg} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSendMessage={onSendMessage} disabled={isLoading} />
    </div>
  );
};
