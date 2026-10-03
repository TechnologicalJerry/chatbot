<script setup lang="ts">
import { ref, watch } from 'vue';
import { useKnowledge } from '../../composables/useKnowledge';
import BaseModal from '../ui/BaseModal.vue';
import BaseButton from '../ui/BaseButton.vue';
import BaseBadge from '../ui/BaseBadge.vue';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits(['close']);

const { documents, searchResults, isLoading, fetchDocuments, uploadDocument, searchVector, deleteDocument } =
  useKnowledge();

const title = ref('');
const content = ref('');
const searchQuery = ref('');

watch(
  () => props.isOpen,
  (val) => {
    if (val) fetchDocuments();
  },
);

const handleUpload = async () => {
  if (!title.value || !content.value) return;
  await uploadDocument(title.value, content.value);
  title.value = '';
  content.value = '';
};

const handleSearch = async () => {
  if (!searchQuery.value) return;
  await searchVector(searchQuery.value);
};
</script>

<template>
  <BaseModal :is-open="props.isOpen" title="RAG Knowledge Base Manager" @close="emit('close')">
    <div class="space-y-6">
      <!-- Document Ingestion -->
      <form class="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-3" @submit.prevent="handleUpload">
        <div class="flex items-center gap-2 text-sm font-semibold text-cyan-300">
          ☁️ <span>Ingest New Document</span>
        </div>

        <input
          v-model="title"
          type="text"
          required
          placeholder="Document Title (e.g. Refund Policy v2.pdf)"
          class="w-full px-3 py-2 text-xs text-white bg-slate-900/80 border border-slate-700 rounded-lg focus:outline-none focus:border-cyan-500"
        >

        <textarea
          v-model="content"
          required
          rows="3"
          placeholder="Paste document text content here..."
          class="w-full px-3 py-2 text-xs text-white bg-slate-900/80 border border-slate-700 rounded-lg focus:outline-none focus:border-cyan-500"
        />

        <BaseButton type="submit" :is-loading="isLoading" size="sm" custom-class="w-full">
          Process & Compute Embeddings
        </BaseButton>
      </form>

      <!-- Vector Similarity Search -->
      <form class="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-3" @submit.prevent="handleSearch">
        <div class="flex items-center gap-2 text-sm font-semibold text-purple-300">
          🔍 <span>Vector Similarity Search Tester</span>
        </div>

        <div class="flex gap-2">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Enter search query..."
            class="flex-1 px-3 py-2 text-xs text-white bg-slate-900/80 border border-slate-700 rounded-lg focus:outline-none focus:border-purple-500"
          >
          <BaseButton type="submit" :is-loading="isLoading" size="sm" variant="secondary">
            Search
          </BaseButton>
        </div>

        <div v-if="searchResults.length > 0" class="space-y-2 pt-2">
          <div class="text-[11px] font-semibold text-slate-400">Top Matches:</div>
          <div
            v-for="result in searchResults"
            :key="result.chunkId"
            class="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs space-y-1"
          >
            <div class="flex justify-between items-center">
              <BaseBadge variant="emerald">Score: {{ (result.score * 100).toFixed(1) }}%</BaseBadge>
            </div>
            <p class="text-slate-300 text-[11px] font-mono">{{ result.content }}</p>
          </div>
        </div>
      </form>

      <!-- Documents List -->
      <div>
        <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Ingested Documents ({{ documents.length }})
        </h4>
        <div class="space-y-2 max-h-48 overflow-y-auto">
          <div v-if="documents.length === 0" class="text-xs text-slate-500 py-4 text-center">
            No documents in knowledge base.
          </div>
          <template v-else>
            <div
              v-for="doc in documents"
              :key="doc._id"
              class="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded-xl"
            >
              <div class="flex items-center gap-2.5 truncate">
                <span class="text-sm">📄</span>
                <div>
                  <div class="text-xs font-medium text-slate-200 truncate">{{ doc.title }}</div>
                  <div class="text-[10px] text-slate-500">{{ doc.chunkCount }} Vector Chunks</div>
                </div>
              </div>
              <button
                class="p-1.5 text-slate-500 hover:text-rose-400 transition-colors text-xs"
                @click="deleteDocument(doc._id)"
              >
                🗑️
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </BaseModal>
</template>
