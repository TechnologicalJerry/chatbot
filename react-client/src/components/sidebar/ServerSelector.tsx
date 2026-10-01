'use client';

import React from 'react';
import { useServer, BACKEND_TARGETS } from '../../context/ServerContext';
import { Server, Activity, RefreshCw } from 'lucide-react';
import { Badge } from '../ui/Badge';

export const ServerSelector: React.FC = () => {
  const { activeServer, setActiveServer, serverHealth, latencyMs, checkHealth } = useServer();

  return (
    <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <Server className="w-3.5 h-3.5 text-cyan-400" />
          <span>Active Backend Target</span>
        </div>

        <button
          onClick={checkHealth}
          title="Re-check health"
          className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${serverHealth === 'checking' ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {BACKEND_TARGETS.map((target) => {
          const isActive = activeServer.port === target.port;
          return (
            <button
              key={target.port}
              onClick={() => setActiveServer(target)}
              className={`px-2 py-1.5 rounded-lg text-xs font-mono transition-all text-center border ${
                isActive
                  ? 'bg-cyan-950/80 border-cyan-500/80 text-cyan-300 shadow-sm shadow-cyan-500/20 font-bold'
                  : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              :{target.port}
              <div className="text-[9px] opacity-75">{target.name.split(' ')[0]}</div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[11px] pt-1">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              serverHealth === 'online'
                ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse'
                : serverHealth === 'checking'
                ? 'bg-amber-400'
                : 'bg-rose-500'
            }`}
          />
          <span className="text-slate-400 capitalize">{serverHealth}</span>
        </div>

        {latencyMs !== null && (
          <Badge variant="emerald" size="sm">
            <Activity className="w-2.5 h-2.5" />
            {latencyMs}ms
          </Badge>
        )}
      </div>
    </div>
  );
};
