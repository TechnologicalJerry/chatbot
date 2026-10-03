<script setup lang="ts">
import { computed } from 'vue';
import type { Message } from '../../types';
import PromptAlert from './PromptAlert.vue';
import BaseBadge from '../ui/BaseBadge.vue';

const props = defineProps<{
  message: Message;
}>();

const containerClass = computed(() => `flex gap-3 my-4 ${props.message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`);
const contentAlignClass = computed(() => `max-w-[80%] ${props.message.role === 'user' ? 'text-right' : 'text-left'}`);

const avatarClass = computed(() => {
  const isUser = props.message.role === 'user';
  const isAssistant = props.message.role === 'assistant';
  return `w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border text-xs ${
    isUser
      ? 'bg-cyan-950 border-cyan-500/40 text-cyan-300'
      : isAssistant
      ? 'bg-purple-950 border-purple-500/40 text-purple-300'
      : 'bg-slate-800 border-slate-700 text-slate-300'
  }`;
});

const avatarIcon = computed(() => {
  if (props.message.role === 'user') return '👤';
  if (props.message.role === 'assistant') return '🤖';
  if (props.message.role === 'tool') return '⚙️';
  return '💻';
});

const bubbleClass = computed(() => {
  const isUser = props.message.role === 'user';
  return `p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap border ${
    isUser
      ? 'bg-gradient-to-r from-cyan-950/80 to-indigo-950/80 border-cyan-500/30 text-white rounded-tr-none shadow-md shadow-cyan-950/20'
      : 'bg-slate-900/90 border-slate-800 text-slate-200 rounded-tl-none shadow-md backdrop-blur-md'
  }`;
});

const toolName = computed(() => {
  const meta: any = props.message.metadata;
  return meta && meta.toolCall && meta.toolCall.name ? meta.toolCall.name : null;
});

const formatTime = (iso?: string) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};
</script>

<template>
  <div :class="containerClass">
    <!-- Role Avatar -->
    <div :class="avatarClass">
      {{ avatarIcon }}
    </div>

    <!-- Bubble Content -->
    <div :class="contentAlignClass">
      <div class="flex items-center gap-2 mb-1">
        <span class="text-[11px] font-semibold text-slate-400 capitalize">{{ props.message.role }}</span>
        <span v-if="props.message.createdAt" class="text-[10px] text-slate-500 font-mono">
          {{ formatTime(props.message.createdAt) }}
        </span>
      </div>

      <PromptAlert v-if="props.message.metadata?.promptInjectionDetected" :patterns="props.message.metadata?.matchedPatterns" />

      <div :class="bubbleClass">
        {{ props.message.content }}

        <span v-if="props.message.isStreaming" class="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse rounded-xs" />
      </div>

      <div v-if="toolName" class="mt-1.5 flex gap-1.5">
        <BaseBadge variant="indigo" size="sm">
          ⚙️ Tool: {{ toolName }}
        </BaseBadge>
      </div>
    </div>
  </div>
</template>
