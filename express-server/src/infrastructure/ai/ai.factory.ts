import { AIOrchestrator } from "./ai.orchestrator";
import { IAIProvider } from "./aiProvider.interface";
import { ChatMessage, ChatCompletionOptions, ChatCompletionResult, AIStreamChunk } from "./types";
import OpenAI from "openai";
import env from "../../config/env";

let currentOrchestrator: AIOrchestrator | null = null;

class DefaultOpenAIProvider implements IAIProvider {
  private client: OpenAI | null = null;

  constructor() {
    if (env.OPENAI_API_KEY && env.OPENAI_API_KEY !== "mock-key") {
      this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    }
  }

  async generateCompletion(
    messages: ChatMessage[],
    options?: ChatCompletionOptions
  ): Promise<ChatCompletionResult> {
    if (this.client) {
      const response = await this.client.chat.completions.create({
        model: options?.model || env.OPENAI_MODEL,
        messages: messages as any,
      });

      const choice = response.choices[0];
      return {
        id: response.id,
        message: {
          role: "assistant",
          content: choice.message.content || "",
          tool_calls: choice.message.tool_calls as any,
        },
        finishReason: choice.finish_reason,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
      };
    }

    const lastMsg = messages[messages.length - 1]?.content || "";
    return {
      id: "mock-ai-res",
      message: {
        role: "assistant",
        content: `Default AI response for: "${lastMsg}"`,
      },
      finishReason: "stop",
      usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
    };
  }

  async *streamResponse(
    messages: ChatMessage[],
    options?: ChatCompletionOptions & { signal?: AbortSignal }
  ): AsyncIterable<AIStreamChunk> {
    if (this.client) {
      const stream = await this.client.chat.completions.create({
        model: options?.model || env.OPENAI_MODEL,
        messages: messages as any,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          yield { type: "text_delta", text: delta };
        }
      }
      yield {
        type: "completion",
        finishReason: "stop",
        usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
      };
      return;
    }

    const lastMsg = messages[messages.length - 1]?.content || "";
    yield { type: "text_delta", text: `Default AI response for: "${lastMsg}"` };
    yield {
      type: "completion",
      finishReason: "stop",
      usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
    };
  }
}

export function setAIOrchestrator(orchestrator: AIOrchestrator | null) {
  currentOrchestrator = orchestrator;
}

export function getAIOrchestrator(): AIOrchestrator {
  if (currentOrchestrator) {
    return currentOrchestrator;
  }
  return new AIOrchestrator(new DefaultOpenAIProvider());
}
