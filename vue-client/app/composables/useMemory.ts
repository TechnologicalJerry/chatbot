import { ref } from 'vue';
import type { MemoryItem } from '../types';
import { useAuth } from './useAuth';

const memories = ref<MemoryItem[]>([]);
const isLoading = ref<boolean>(false);

export function useMemory() {
  const { apiFetch } = useAuth();

  const fetchMemories = async () => {
    try {
      const data = await apiFetch('/api/v1/memory');
      memories.value = data || [];
    } catch {
      memories.value = [];
    }
  };

  const addMemory = async (fact: string) => {
    isLoading.value = true;
    try {
      await apiFetch('/api/v1/memory', {
        method: 'POST',
        body: JSON.stringify({ fact }),
      });
      await fetchMemories();
    } finally {
      isLoading.value = false;
    }
  };

  const deleteMemory = async (id: string) => {
    await apiFetch(`/api/v1/memory/${id}`, { method: 'DELETE' });
    await fetchMemories();
  };

  return {
    memories,
    isLoading,
    fetchMemories,
    addMemory,
    deleteMemory,
  };
}
