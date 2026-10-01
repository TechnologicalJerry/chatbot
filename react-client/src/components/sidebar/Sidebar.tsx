'use client';

import React from 'react';
import { Conversation } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ServerSelector } from './ServerSelector';
import {
  MessageSquarePlus,
  MessageSquare,
  BookOpen,
  BrainCircuit,
  LogOut,
  LogIn,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onOpenKnowledge: () => void;
  onOpenMemory: () => void;
  onOpenAuth: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onOpenKnowledge,
  onOpenMemory,
  onOpenAuth,
}) => {
  const { user, logout } = useAuth();

  return (
    <aside className="w-80 h-screen flex flex-col bg-slate-950/90 border-r border-slate-800/80 backdrop-blur-2xl">
      {/* Header / Brand */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
              AI Chatbot OS
            </h1>
            <p className="text-[10px] text-slate-400 font-mono">Multi-Backend Architecture</p>
          </div>
        </div>

        <ServerSelector />
      </div>

      {/* Primary Action Button */}
      <div className="p-3">
        <Button onClick={onNewConversation} className="w-full justify-start gap-2 shadow-md">
          <MessageSquarePlus className="w-4 h-4" />
          <span>New Chat</span>
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1">
        <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
          History ({conversations.length})
        </div>

        {conversations.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-slate-500">
            No active conversations yet. Start a new chat above!
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv._id === activeConversationId;
            return (
              <div
                key={conv._id}
                onClick={() => onSelectConversation(conv._id)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all border ${
                  isActive
                    ? 'bg-slate-800/80 border-cyan-500/40 text-cyan-300 font-medium shadow-sm'
                    : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span className="text-xs truncate">{conv.title}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conv._id);
                  }}
                  title="Delete thread"
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Feature Drawers Opener */}
      <div className="p-3 border-t border-slate-800/80 space-y-1.5">
        <button
          onClick={onOpenKnowledge}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-cyan-300 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition-all"
        >
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span>Knowledge Base (RAG)</span>
        </button>

        <button
          onClick={onOpenMemory}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-purple-300 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition-all"
        >
          <BrainCircuit className="w-4 h-4 text-purple-400" />
          <span>Long-Term Memory</span>
        </button>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <div className="text-xs font-medium text-slate-200 truncate">{user.name}</div>
              <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Button onClick={onOpenAuth} variant="secondary" className="w-full justify-center gap-2">
            <LogIn className="w-4 h-4" />
            <span>Sign In / Register</span>
          </Button>
        )}
      </div>
    </aside>
  );
};
