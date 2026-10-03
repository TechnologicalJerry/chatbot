<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  disabled?: boolean;
}>();

const emit = defineEmits(['send']);

const text = ref('');
const model = ref('gpt-4o-mini');
const useStreaming = ref(true);

const handleSubmit = () => {
  if (!text.value.trim() || props.disabled) return;
  emit('send', {
    message: text.value.trim(),
    model: model.value,
    useStreaming: useStreaming.value,
  });
  text.value = '';
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSubmit();
  }
};

const streamingBtnClass = computed(() =>
  useStreaming.value
    ? 'flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono transition-all border bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
    : 'flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono transition-all border bg-slate-900 border-slate-800 text-slate-400',
);
</script>

<template>
  <form class="p-4 bg-slate-950/90 border-t border-slate-800/80" @submit.prevent="handleSubmit">
    <div class="flex items-center justify-between gap-3 mb-2 px-1 text-xs">
      <div class="flex items-center gap-2">
        <span>⚡</span>
        <select
          v-model="model"
          class="bg-slate-900 text-slate-300 border border-slate-800 rounded-lg px-2 py-1 focus:outline-none text-xs"
        >
          <option value="gpt-4o-mini">gpt-4o-mini (Fast)</option>
          <option value="gpt-4o">gpt-4o (High Intelligence)</option>
          <option value="mock-engine">Mock Engine (Offline)</option>
        </select>
      </div>

      <button
        type="button"
        :class="streamingBtnClass"
        @click="useStreaming = !useStreaming"
      >
        <span>📡 SSE Stream: {{ useStreaming ? 'ON' : 'OFF' }}</span>
      </button>
    </div>

    <div class="relative flex items-center">
      <textarea
        v-model="text"
        rows="2"
        :disabled="props.disabled"
        placeholder="Ask anything... (Press Enter to send, Shift+Enter for new line)"
        class="w-full py-3 pl-4 pr-12 text-sm text-white bg-slate-900/90 border border-slate-800 rounded-2xl focus:outline-none focus:border-cyan-500/80 resize-none shadow-inner"
        @keydown="handleKeyDown"
      />

      <button
        type="submit"
        :disabled="props.disabled || !text.trim()"
        class="absolute right-3 p-2 text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-md shadow-cyan-500/20 text-xs"
      >
        🚀
      </button>
    </div>
  </form>
</template>
