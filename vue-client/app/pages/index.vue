<script setup lang="ts">
import { ref } from 'vue';
import AppSidebar from '../components/sidebar/AppSidebar.vue';
import ChatArea from '../components/chat/ChatArea.vue';
import AuthModal from '../components/auth/AuthModal.vue';
import KnowledgeModal from '../components/panels/KnowledgeModal.vue';
import MemoryDrawer from '../components/panels/MemoryDrawer.vue';

const isAuthOpen = ref(false);
const isKnowledgeOpen = ref(false);
const isMemoryOpen = ref(false);
</script>

<template>
  <div class="flex h-screen w-screen overflow-hidden bg-slate-950">
    <AppSidebar
      @open-knowledge="isKnowledgeOpen = true"
      @open-memory="isMemoryOpen = true"
      @open-auth="isAuthOpen = true"
    />

    <ChatArea />

    <AuthModal :is-open="isAuthOpen" @close="isAuthOpen = false" />
    <KnowledgeModal :is-open="isKnowledgeOpen" @close="isKnowledgeOpen = false" />
    <MemoryDrawer :is-open="isMemoryOpen" @close="isMemoryOpen = false" />
  </div>
</template>
