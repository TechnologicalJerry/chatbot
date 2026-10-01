'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ServerTarget } from '../types';

export const BACKEND_TARGETS: ServerTarget[] = [
  { name: 'Express.js', url: 'http://localhost:3000', port: 3000, badge: 'Express 4.x' },
  { name: 'Nest.js 12', url: 'http://localhost:3001', port: 3001, badge: 'Nest.js 12' },
  { name: 'Fastify 5', url: 'http://localhost:3002', port: 3002, badge: 'Fastify 5' },
];

interface ServerContextType {
  activeServer: ServerTarget;
  setActiveServer: (target: ServerTarget) => void;
  serverHealth: 'online' | 'offline' | 'checking';
  latencyMs: number | null;
  checkHealth: () => Promise<void>;
}

const ServerContext = createContext<ServerContextType | undefined>(undefined);

export function ServerProvider({ children }: { children: React.ReactNode }) {
  const [activeServer, setActiveServerState] = useState<ServerTarget>(BACKEND_TARGETS[0]);
  const [serverHealth, setServerHealth] = useState<'online' | 'offline' | 'checking'>('checking');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const setActiveServer = (target: ServerTarget) => {
    setActiveServerState(target);
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatbot_server_target', JSON.stringify(target));
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chatbot_server_target');
      if (saved) {
        try {
          setActiveServerState(JSON.parse(saved));
        } catch {}
      }
    }
  }, []);

  const checkHealth = async () => {
    setServerHealth('checking');
    const start = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`${activeServer.url}/health/live`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        setLatencyMs(Math.round(performance.now() - start));
        setServerHealth('online');
      } else {
        setServerHealth('offline');
        setLatencyMs(null);
      }
    } catch {
      setServerHealth('offline');
      setLatencyMs(null);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [activeServer]);

  return (
    <ServerContext.Provider
      value={{
        activeServer,
        setActiveServer,
        serverHealth,
        latencyMs,
        checkHealth,
      }}
    >
      {children}
    </ServerContext.Provider>
  );
}

export function useServer() {
  const context = useContext(ServerContext);
  if (!context) throw new Error('useServer must be used within ServerProvider');
  return context;
}
