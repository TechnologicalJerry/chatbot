'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { useServer } from './ServerContext';
import { apiFetch } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string, tier?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { activeServer } = useServer();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('chatbot_token') : null;
    const savedUser = typeof window !== 'undefined' ? localStorage.getItem('chatbot_user') : null;

    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch {}
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const data = await apiFetch(activeServer.url, '/api/v1/sessions', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
      });

      const authToken = data.accessToken;
      const userInfo = data.user;

      setToken(authToken);
      setUser(userInfo);

      if (typeof window !== 'undefined') {
        localStorage.setItem('chatbot_token', authToken);
        localStorage.setItem('chatbot_user', JSON.stringify(userInfo));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, pass: string, name: string, tier?: string) => {
    setIsLoading(true);
    try {
      await apiFetch(activeServer.url, '/api/v1/users/register', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass, name, tier: tier || 'free' }),
      });
      // Auto login after registration
      await login(email, pass);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (token) {
      await apiFetch(activeServer.url, '/api/v1/sessions/current', { method: 'DELETE' }).catch(() => {});
    }
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('chatbot_token');
      localStorage.removeItem('chatbot_user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
