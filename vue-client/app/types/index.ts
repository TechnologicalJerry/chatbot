export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  tier: 'free' | 'pro' | 'enterprise';
  createdAt?: string;
}

export interface Conversation {
  _id: string;
  user: string;
  title: string;
  archived?: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id?: string;
  conversationId: string;
  userId?: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  metadata?: {
    promptInjectionDetected?: boolean;
    matchedPatterns?: string[];
    [key: string]: any;
  };
  createdAt?: string;
  isStreaming?: boolean;
}

export interface KnowledgeDocument {
  _id: string;
  userId: string;
  title: string;
  content: string;
  chunkCount: number;
  createdAt: string;
}

export interface ScoredChunk {
  chunkId: string;
  documentId: string;
  content: string;
  score: number;
}

export interface MemoryItem {
  _id: string;
  userId: string;
  fact: string;
  source: 'user_provided' | 'extracted';
  confidence: number;
  createdAt: string;
}

export interface ServerTarget {
  name: string;
  url: string;
  port: number;
  badge: string;
}
