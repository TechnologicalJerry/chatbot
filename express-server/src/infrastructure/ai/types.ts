export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  executionContext?: {
    userId: string;
    conversationId: string;
  };
}

export interface ChatCompletionResult {
  id: string;
  message: {
    role: "assistant";
    content: string;
    tool_calls?: ToolCall[];
  };
  finishReason?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIStreamChunk {
  type: "text_delta" | "completion" | "tool_call";
  text?: string;
  finishReason?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIContext {
  systemInstructions: string;
  recentMessages: ChatMessage[];
  memories?: any[];
  ragContext?: string;
  summary?: string;
}
