<script setup lang="ts">
import { watch } from 'vue';

const props = defineProps<{
  isOpen: boolean;
  title: string;
}>();

const emit = defineEmits(['close']);

watch(
  () => props.isOpen,
  (val) => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = val ? 'hidden' : 'unset';
    }
  },
);
</script>

<template>
  <Teleport to="body">
    <div
      v-if="props.isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        class="relative w-full max-w-2xl bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
      >
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <h3 class="text-lg font-semibold text-white tracking-wide">{{ props.title }}</h3>
          <button
            class="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>
        <div class="p-6 max-h-[80vh] overflow-y-auto">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>
