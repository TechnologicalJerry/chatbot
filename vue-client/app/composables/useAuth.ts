import { ref, onMounted } from 'vue';
import type { User } from '../types';
import { useServer } from './useServer';

const user = ref<User | null>(null);
const token = ref<string | null>(null);
const isLoading = ref<boolean>(false);

export function useAuth() {
  const { activeServer } = useServer();

  onMounted(() => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('chatbot_vue_token');
      const savedUser = localStorage.getItem('chatbot_vue_user');
      if (savedToken && savedUser) {
        token.value = savedToken;
        try {
          user.value = JSON.parse(savedUser);
        } catch {}
      }
    }
  });

  const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const authToken = token.value || (typeof window !== 'undefined' ? localStorage.getItem('chatbot_vue_token') : null);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const url = `${activeServer.value.url}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || data.error || `HTTP ${res.status} Error`);
    }
    return data;
  };

  const login = async (email: string, pass: string) => {
    isLoading.value = true;
    try {
      const data = await apiFetch('/api/v1/sessions', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
      });

      token.value = data.accessToken;
      user.value = data.user;

      if (typeof window !== 'undefined') {
        localStorage.setItem('chatbot_vue_token', data.accessToken);
        localStorage.setItem('chatbot_vue_user', JSON.stringify(data.user));
      }
    } finally {
      isLoading.value = false;
    }
  };

  const register = async (email: string, pass: string, name: string, tier = 'free') => {
    isLoading.value = true;
    try {
      await apiFetch('/api/v1/users/register', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass, name, tier }),
      });
      await login(email, pass);
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async () => {
    if (token.value) {
      await apiFetch('/api/v1/sessions/current', { method: 'DELETE' }).catch(() => {});
    }
    token.value = null;
    user.value = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('chatbot_vue_token');
      localStorage.removeItem('chatbot_vue_user');
    }
  };

  return {
    user,
    token,
    isLoading,
    apiFetch,
    login,
    register,
    logout,
  };
}
