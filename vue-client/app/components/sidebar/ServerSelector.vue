<script setup lang="ts">
import { useServer } from '../../composables/useServer';
import BaseBadge from '../ui/BaseBadge.vue';

const { activeServer, serverHealth, latencyMs, setActiveServer, checkHealth, targets } = useServer();

const getButtonClass = (port: number) => {
  const isActive = activeServer.value.port === port;
  return isActive
    ? 'px-2 py-1.5 rounded-lg text-xs font-mono transition-all text-center border bg-cyan-950/80 border-cyan-500/80 text-cyan-300 shadow-sm shadow-cyan-500/20 font-bold'
    : 'px-2 py-1.5 rounded-lg text-xs font-mono transition-all text-center border bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200';
};

const getHealthDotClass = () => {
  const health = serverHealth.value;
  if (health === 'online') return 'w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse';
  if (health === 'checking') return 'w-2 h-2 rounded-full bg-amber-400';
  return 'w-2 h-2 rounded-full bg-rose-500';
};
</script>

<template>
  <div class="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
        <span>🖥️ Active Backend Target</span>
      </div>

      <button
        title="Re-check health"
        class="p-1 text-slate-400 hover:text-cyan-400 transition-colors text-xs"
        @click="checkHealth"
      >
        🔄
      </button>
    </div>

    <div class="grid grid-cols-3 gap-1.5">
      <button
        v-for="target in targets"
        :key="target.port"
        :class="getButtonClass(target.port)"
        @click="setActiveServer(target)"
      >
        :{{ target.port }}
        <div class="text-[9px] opacity-75">{{ target.name.split(' ')[0] }}</div>
      </button>
    </div>

    <div class="flex items-center justify-between text-[11px] pt-1">
      <div class="flex items-center gap-1.5">
        <span :class="getHealthDotClass()" />
        <span class="text-slate-400 capitalize">{{ serverHealth }}</span>
      </div>

      <BaseBadge v-if="latencyMs !== null" variant="emerald" size="sm">
        ⚡ {{ latencyMs }}ms
      </BaseBadge>
    </div>
  </div>
</template>
