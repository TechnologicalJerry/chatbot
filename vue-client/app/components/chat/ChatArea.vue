<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { useChat } from '../../composables/useChat';
import { useServer } from '../../composables/useServer';
import MessageBubble from './MessageBubble.vue';
import ChatInput from './ChatInput.vue';
import BaseBadge from '../ui/BaseBadge.vue';

const { activeServer } = useServer();
const { conversations, activeConversationId, messages, isLoading, sendMessage } = useChat();

const scrollContainer = ref<HTMLElement | null>(null);

const activeConversation = computed(() => {
  const id = activeConversationId.value;
  return conversations.value.find((c) => c._id === id) || null;
});

const handleSend = async (event: { message: string; model: string; useStreaming: boolean }) => {
  await sendMessage(event.message, event.model, event.useStreaming);
  nextTick(() => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight;
    }
  });
};
</script>

<template>
  <div v-if="!activeConversation" class="flex-1 h-screen flex flex-col items-center justify-center p-8 bg-slate-950 text-center">
    <div class="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl mb-4">
      <span class="text-4xl animate-pulse">✨</span>
    </div>
    <h2 class="text-xl font-bold text-white mb-2">Welcome to AI Chatbot OS</h2>
    <p class="text-sm text-slate-400 max-w-md mb-6">
      Nuxt 4 Composition client connected seamlessly to Express, Nest.js, or Fastify backends with real-time SSE streaming.
    </p>
    <div class="flex items-center gap-2">
      <BaseBadge variant="cyan" size="md">
        🖥️ Active Target: {{ activeServer.name }} (:{{ activeServer.port }})
      </BaseBadge>
    </div>
  </div>

  <div v-else class="flex-1 h-screen flex flex-col bg-slate-950">
    <!-- Header -->
    <div class="px-6 py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/80 backdrop-blur-xl">
      <div class="flex items-center gap-2.5">
        <span class="text-sm">💬</span>
        <h2 class="text-sm font-semibold text-white truncate max-w-xs">{{ activeConversation.title }}</h2>
      </div>

      <div class="flex items-center gap-2">
        <BaseBadge variant="cyan" size="sm">
          🖥️ {{ activeServer.name }}
        </BaseBadge>
      </div>
    </div>

    <!-- Messages Feed -->
    <div ref="scrollContainer" class="flex-1 overflow-y-auto p-6 space-y-2">
      <div v-if="messages.length === 0" class="h-full flex items-center justify-center text-xs text-slate-500">
        No messages in this conversation yet. Type your query below!
      </div>
      <template v-else>
        <MessageBubble v-for="(msg, index) in messages" :key="msg._id || index" :message="msg" />
      </template>
    </div>

    <!-- Input -->
    <ChatInput :disabled="isLoading" @send="handleSend" />
  </div>
</template>
