import { ChatMessage, ChatCompletionOptions, ChatCompletionResult, AIStreamChunk } from "./types";

export interface IAIProvider {
  generateCompletion(
    messages: ChatMessage[],
    options?: ChatCompletionOptions
  ): Promise<ChatCompletionResult>;

  streamResponse(
    messages: ChatMessage[],
    options?: ChatCompletionOptions & { signal?: AbortSignal }
  ): AsyncIterable<AIStreamChunk>;
}
