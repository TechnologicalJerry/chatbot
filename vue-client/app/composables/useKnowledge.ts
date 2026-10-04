import { ref } from 'vue';
import type { KnowledgeDocument, ScoredChunk } from '../types';
import { useAuth } from './useAuth';

const documents = ref<KnowledgeDocument[]>([]);
const searchResults = ref<ScoredChunk[]>([]);
const isLoading = ref<boolean>(false);

export function useKnowledge() {
  const { apiFetch } = useAuth();

  const fetchDocuments = async () => {
    try {
      const data = await apiFetch('/api/v1/knowledge');
      documents.value = data || [];
    } catch {
      documents.value = [];
    }
  };

  const uploadDocument = async (title: string, content: string) => {
    isLoading.value = true;
    try {
      await apiFetch('/api/v1/knowledge', {
        method: 'POST',
        body: JSON.stringify({ title, content }),
      });
      await fetchDocuments();
    } finally {
      isLoading.value = false;
    }
  };

  const searchVector = async (query: string) => {
    isLoading.value = true;
    try {
      const data = await apiFetch(`/api/v1/knowledge/search?q=${encodeURIComponent(query)}`);
      searchResults.value = data || [];
    } catch {
      searchResults.value = [];
    } finally {
      isLoading.value = false;
    }
  };

  const deleteDocument = async (id: string) => {
    await apiFetch(`/api/v1/knowledge/${id}`, { method: 'DELETE' });
    await fetchDocuments();
  };

  return {
    documents,
    searchResults,
    isLoading,
    fetchDocuments,
    uploadDocument,
    searchVector,
    deleteDocument,
  };
}
