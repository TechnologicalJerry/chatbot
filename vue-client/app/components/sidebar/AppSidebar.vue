<script setup lang="ts">
import { useAuth } from '../../composables/useAuth';
import { useChat } from '../../composables/useChat';
import ServerSelector from './ServerSelector.vue';
import BaseButton from '../ui/BaseButton.vue';

const emit = defineEmits(['openKnowledge', 'openMemory', 'openAuth']);

const { user, logout } = useAuth();
const { conversations, activeConversationId, selectConversation, createConversation, deleteConversation } = useChat();

const getConvItemClass = (id: string) => {
  const isActive = activeConversationId.value === id;
  return isActive
    ? 'group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all border bg-slate-800/80 border-cyan-500/40 text-cyan-300 font-medium shadow-sm'
    : 'group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all border bg-transparent border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200';
};

const onDeleteConv = (e: Event, id: string) => {
  e.stopPropagation();
  deleteConversation(id);
};
</script>

<template>
  <aside class="w-80 h-screen flex flex-col bg-slate-950/90 border-r border-slate-800/80 backdrop-blur-2xl">
    <!-- Brand Header -->
    <div class="p-4 border-b border-slate-800/80">
      <div class="flex items-center gap-2.5 mb-3">
        <div class="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 shadow-lg shadow-cyan-500/20 text-white font-bold text-sm">
          ✨
        </div>
        <div>
          <h1 class="text-base font-bold text-white tracking-wide bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
            AI Chatbot OS
          </h1>
          <p class="text-[10px] text-slate-400 font-mono">Nuxt 4 Composition Architecture</p>
        </div>
      </div>

      <ServerSelector />
    </div>

    <!-- Primary New Chat Button -->
    <div class="p-3">
      <BaseButton custom-class="w-full justify-start gap-2 shadow-md" @click="createConversation()">
        💬 <span>New Chat</span>
      </BaseButton>
    </div>

    <!-- Conversations List -->
    <div class="flex-1 overflow-y-auto px-3 space-y-1">
      <div class="px-2 py-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
        History ({{ conversations.length }})
      </div>

      <div v-if="conversations.length === 0" class="px-3 py-6 text-center text-xs text-slate-500">
        No active conversations yet. Start a new chat above!
      </div>
      <template v-else>
        <div
          v-for="conv in conversations"
          :key="conv._id"
          :class="getConvItemClass(conv._id)"
          @click="selectConversation(conv._id)"
        >
          <div class="flex items-center gap-2.5 truncate">
            <span class="text-xs">💬</span>
            <span class="text-xs truncate">{{ conv.title }}</span>
          </div>

          <button
            title="Delete thread"
            class="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity text-xs"
            @click="onDeleteConv($event, conv._id)"
          >
            🗑️
          </button>
        </div>
      </template>
    </div>

    <!-- Drawers Opener -->
    <div class="p-3 border-t border-slate-800/80 space-y-1.5">
      <button
        class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-cyan-300 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition-all"
        @click="emit('openKnowledge')"
      >
        📖 <span>Knowledge Base (RAG)</span>
      </button>

      <button
        class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-purple-300 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition-all"
        @click="emit('openMemory')"
      >
        🧠 <span>Long-Term Memory</span>
      </button>
    </div>

    <!-- User Footer -->
    <div class="p-3 border-t border-slate-800/80 bg-slate-950">
      <div v-if="user" class="flex items-center justify-between">
        <div class="truncate pr-2">
          <div class="text-xs font-medium text-slate-200 truncate">{{ user.name }}</div>
          <div class="text-[10px] text-slate-400 truncate">{{ user.email }}</div>
        </div>
        <button
          title="Sign Out"
          class="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition-colors text-xs"
          @click="logout()"
        >
          🚪
        </button>
      </div>
      <BaseButton v-else variant="secondary" custom-class="w-full justify-center gap-2" @click="emit('openAuth')">
        🔑 <span>Sign In / Register</span>
      </BaseButton>
    </div>
  </aside>
</template>
