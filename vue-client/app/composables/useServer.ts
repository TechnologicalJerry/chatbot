import { ref, onMounted } from 'vue';
import type { ServerTarget } from '../types';

export const BACKEND_TARGETS: ServerTarget[] = [
  { name: 'Express.js', url: 'http://localhost:3000', port: 3000, badge: 'Express 4.x' },
  { name: 'Nest.js 12', url: 'http://localhost:3001', port: 3001, badge: 'Nest.js 12' },
  { name: 'Fastify 5', url: 'http://localhost:3002', port: 3002, badge: 'Fastify 5' },
];

const activeServer = ref<ServerTarget>(BACKEND_TARGETS[0]);
const serverHealth = ref<'online' | 'offline' | 'checking'>('checking');
const latencyMs = ref<number | null>(null);

export function useServer() {
  const setActiveServer = (target: ServerTarget) => {
    activeServer.value = target;
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatbot_vue_server_target', JSON.stringify(target));
    }
    checkHealth();
  };

  const checkHealth = async () => {
    serverHealth.value = 'checking';
    const start = performance.now();
    try {
      const res = await fetch(`${activeServer.value.url}/health/live`);
      if (res.ok) {
        latencyMs.value = Math.round(performance.now() - start);
        serverHealth.value = 'online';
      } else {
        serverHealth.value = 'offline';
        latencyMs.value = null;
      }
    } catch {
      serverHealth.value = 'offline';
      latencyMs.value = null;
    }
  };

  onMounted(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chatbot_vue_server_target');
      if (saved) {
        try {
          activeServer.value = JSON.parse(saved);
        } catch {}
      }
    }
    checkHealth();
  });

  return {
    activeServer,
    serverHealth,
    latencyMs,
    setActiveServer,
    checkHealth,
    targets: BACKEND_TARGETS,
  };
}
