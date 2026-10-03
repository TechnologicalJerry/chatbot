<script setup lang="ts">
import { ref, watch } from 'vue';
import { useMemory } from '../../composables/useMemory';
import BaseModal from '../ui/BaseModal.vue';
import BaseButton from '../ui/BaseButton.vue';
import BaseBadge from '../ui/BaseBadge.vue';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits(['close']);

const { memories, isLoading, fetchMemories, addMemory, deleteMemory } = useMemory();
const fact = ref('');

watch(
  () => props.isOpen,
  (val) => {
    if (val) fetchMemories();
  },
);

const handleAdd = async () => {
  if (!fact.value) return;
  await addMemory(fact.value);
  fact.value = '';
};
</script>

<template>
  <BaseModal :is-open="props.isOpen" title="Long-Term User Memory" @close="emit('close')">
    <div class="space-y-6">
      <form class="flex gap-2" @submit.prevent="handleAdd">
        <input
          v-model="fact"
          type="text"
          required
          placeholder="Add memory fact (e.g. User prefers TypeScript over JS)"
          class="flex-1 px-3 py-2 text-xs text-white bg-slate-800/70 border border-slate-700/80 rounded-xl focus:outline-none focus:border-purple-500"
        >
        <BaseButton type="submit" :is-loading="isLoading" size="sm">
          ➕ Save Fact
        </BaseButton>
      </form>

      <div class="space-y-2">
        <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Stored Memories ({{ memories.length }})
        </h4>

        <div v-if="memories.length === 0" class="p-6 text-center text-xs text-slate-500 bg-slate-900/40 border border-slate-800 rounded-xl">
          No memory facts stored yet. The AI automatically extracts facts during conversation or you can add them manually above.
        </div>
        <template v-else>
          <div
            v-for="mem in memories"
            :key="mem._id"
            class="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded-xl"
          >
            <div class="flex items-center gap-2.5">
              <span class="text-sm">🧠</span>
              <div>
                <div class="text-xs font-medium text-slate-200">{{ mem.fact }}</div>
                <div class="flex items-center gap-2 mt-1">
                  <BaseBadge :variant="mem.source === 'extracted' ? 'indigo' : 'emerald'" size="sm">
                    {{ mem.source }}
                  </BaseBadge>
                  <span class="text-[10px] text-slate-500">
                    Confidence: {{ (mem.confidence * 100).toFixed(0) }}%
                  </span>
                </div>
              </div>
            </div>

            <button
              class="p-1.5 text-slate-500 hover:text-rose-400 transition-colors text-xs"
              @click="deleteMemory(mem._id)"
            >
              🗑️
            </button>
          </div>
        </template>
      </div>
    </div>
  </BaseModal>
</template>
