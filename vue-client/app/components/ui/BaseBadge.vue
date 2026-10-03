<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    variant?: 'cyan' | 'indigo' | 'emerald' | 'rose' | 'amber' | 'slate';
    size?: 'sm' | 'md';
    customClass?: string;
  }>(),
  {
    variant: 'cyan',
    size: 'md',
    customClass: '',
  },
);

const classes = computed(() => {
  const variants = {
    cyan: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/30',
    indigo: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/30',
    emerald: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30',
    rose: 'bg-rose-950/80 text-rose-300 border-rose-500/30',
    amber: 'bg-amber-950/80 text-amber-300 border-amber-500/30',
    slate: 'bg-slate-800/80 text-slate-300 border-slate-700/50',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return `inline-flex items-center gap-1 font-mono font-medium rounded-lg border backdrop-blur-md ${variants[props.variant]} ${sizes[props.size]} ${props.customClass}`;
});
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>
