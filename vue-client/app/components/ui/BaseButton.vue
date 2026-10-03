<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    type?: 'button' | 'submit' | 'reset';
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    disabled?: boolean;
    customClass?: string;
  }>(),
  {
    type: 'button',
    variant: 'primary',
    size: 'md',
    isLoading: false,
    disabled: false,
    customClass: '',
  },
);

const emit = defineEmits(['click']);

const classes = computed(() => {
  const base =
    'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variants = {
    primary:
      'bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/20 border border-cyan-400/30',
    secondary:
      'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/80 backdrop-blur-md',
    danger:
      'bg-rose-600/80 hover:bg-rose-500/80 text-white border border-rose-500/40 shadow-lg shadow-rose-500/20',
    ghost:
      'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white',
  };

  return `${base} ${sizes[props.size]} ${variants[props.variant]} ${props.customClass}`;
});
</script>

<template>
  <button
    :type="props.type"
    :disabled="props.disabled || props.isLoading"
    :class="classes"
    @click="emit('click', $event)"
  >
    <span v-if="props.isLoading" class="flex items-center gap-2">
      <svg class="w-4 h-4 animate-spin text-current" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      Loading...
    </span>
    <slot v-else />
  </button>
</template>
