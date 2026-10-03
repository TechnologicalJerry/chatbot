import { ref, watch } from 'vue';
import type { Conversation, Message } from '../types';
import { useServer } from './useServer';
import { useAuth } from './useAuth';

const conversations = ref<Conversation[]>([]);
const activeConversationId = ref<string | null>(null);
const messages = ref<Message[]>([]);
const isLoading = ref<boolean>(false);

export function useChat() {
  const { activeServer } = useServer();
  const { user, token, apiFetch } = useAuth();

  const fetchConversations = async () => {
    if (!user.value) {
      conversations.value = [];
      activeConversationId.value = null;
      messages.value = [];
      return;
    }

    try {
      const data = await apiFetch('/api/v1/conversations');
      const items = data.items || [];
      conversations.value = items;
      if (items.length > 0 && !activeConversationId.value) {
        selectConversation(items[0]._id);
      }
    } catch {
      conversations.value = [];
    }
  };

  const selectConversation = async (conversationId: string) => {
    activeConversationId.value = conversationId;
    try {
      const data = await apiFetch(`/api/v1/conversations/${conversationId}/messages`);
      messages.value = data.items || [];
    } catch {
      messages.value = [];
    }
  };

  const createConversation = async (title = 'New Conversation') => {
    const newConv = await apiFetch('/api/v1/conversations', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });

    conversations.value = [newConv, ...conversations.value];
    selectConversation(newConv._id);
    return newConv;
  };

  const deleteConversation = async (id: string) => {
    await apiFetch(`/api/v1/conversations/${id}`, { method: 'DELETE' });
    conversations.value = conversations.value.filter((c) => c._id !== id);

    if (activeConversationId.value === id) {
      if (conversations.value.length > 0) {
        selectConversation(conversations.value[0]._id);
      } else {
        activeConversationId.value = null;
        messages.value = [];
      }
    }
  };

  const sendMessage = async (userText: string, model: string, useStreaming: boolean) => {
    let targetConvId = activeConversationId.value;
    if (!targetConvId) {
      const newConv = await createConversation(userText.slice(0, 25));
      targetConvId = newConv._id;
    }

    const tempUserMsg: Message = {
      conversationId: targetConvId,
      role: 'user',
      content: userText,
      createdAt: new Date().toISOString(),
    };

    messages.value.push(tempUserMsg);
    isLoading.value = true;

    if (useStreaming) {
      const tempAssistantMsg: Message = {
        conversationId: targetConvId,
        role: 'assistant',
        content: '',
        isStreaming: true,
        createdAt: new Date().toISOString(),
      };

      messages.value.push(tempAssistantMsg);

      const url = `${activeServer.value.url}/api/v1/chat/stream?conversationId=${encodeURIComponent(
        targetConvId,
      )}&message=${encodeURIComponent(userText)}`;

      try {
        const response = await fetch(url, {
          headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
        });

        if (!response.ok) throw new Error('SSE stream error');
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader');

        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let currentEvent = 'message';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (trimmed.startsWith('event:')) {
              currentEvent = trimmed.replace('event:', '').trim();
            } else if (trimmed.startsWith('data:')) {
              const rawData = trimmed.replace('data:', '').trim();
              try {
                const parsed = JSON.parse(rawData);
                if (currentEvent === 'chunk' && parsed.content) {
                  const last = messages.value[messages.value.length - 1];
                  if (last && last.role === 'assistant') last.content += parsed.content;
                } else if (currentEvent === 'done') {
                  const last = messages.value[messages.value.length - 1];
                  if (last && last.role === 'assistant') last.isStreaming = false;
                }
              } catch {
                if (currentEvent === 'chunk') {
                  const last = messages.value[messages.value.length - 1];
                  if (last && last.role === 'assistant') last.content += rawData;
                }
              }
            }
          }
        }
      } catch {
        selectConversation(targetConvId);
      } finally {
        isLoading.value = false;
      }
    } else {
      try {
        const res = await apiFetch('/api/v1/chat', {
          method: 'POST',
          body: JSON.stringify({ conversationId: targetConvId, message: userText, model }),
        });

        const assistantMsg: Message = {
          conversationId: targetConvId,
          role: 'assistant',
          content: res.content,
          createdAt: new Date().toISOString(),
        };

        messages.value.push(assistantMsg);
      } finally {
        isLoading.value = false;
      }
    }
  };

  watch([activeServer, user], () => {
    fetchConversations();
  });

  return {
    conversations,
    activeConversationId,
    messages,
    isLoading,
    fetchConversations,
    selectConversation,
    createConversation,
    deleteConversation,
    sendMessage,
  };
}
