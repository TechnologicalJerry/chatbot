import { IAIProvider } from "./aiProvider.interface";
import { ChatMessage, ChatCompletionOptions, ChatCompletionResult, AIStreamChunk } from "./types";
import ToolRegistry from "./tools/toolRegistry";
import logger from "../logger/logger";
import { aiRequestsCounter, aiRequestDurationHistogram, aiToolCallsCounter } from "../metrics/metrics";

export class AIOrchestrator {
  private provider: IAIProvider;

  constructor(provider: IAIProvider) {
    this.provider = provider;
  }

  async generateCompletion(
    messages: ChatMessage[],
    options?: ChatCompletionOptions
  ): Promise<ChatCompletionResult> {
    const startTime = Date.now();
    const model = options?.model || "gpt-4o-mini";
    let currentMessages = [...messages];
    let maxIterations = 5;

    while (maxIterations > 0) {
      maxIterations--;
      try {
        const result = await this.provider.generateCompletion(currentMessages, options);
        
        if (result.message.tool_calls && result.message.tool_calls.length > 0) {
          currentMessages.push({
            role: "assistant",
            content: result.message.content || "",
            tool_calls: result.message.tool_calls,
          });

          for (const toolCall of result.message.tool_calls) {
            const toolName = toolCall.function.name;
            aiToolCallsCounter.inc({ tool: toolName });
            
            let args = {};
            try {
              args = JSON.parse(toolCall.function.arguments || "{}");
            } catch {}

            let output: any = "";
            try {
              const registry = ToolRegistry.getInstance();
              output = await registry.executeTool(toolName, args, {
                userId: options?.executionContext?.userId,
              });
            } catch (err: any) {
              logger.error({ err, toolName }, "Tool execution failed in AIOrchestrator");
              output = { error: err.message || "Tool execution failed" };
            }

            currentMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: typeof output === "string" ? output : JSON.stringify(output),
            });
          }
          continue; // Loop back for next AI response after tool execution
        }

        const duration = (Date.now() - startTime) / 1000;
        aiRequestDurationHistogram.observe({ model }, duration);
        aiRequestsCounter.inc({ model, status: "success" });

        return result;
      } catch (err) {
        aiRequestsCounter.inc({ model, status: "error" });
        throw err;
      }
    }

    throw new Error("Maximum tool execution iterations exceeded");
  }

  async *streamCompletion(
    messages: ChatMessage[],
    options?: ChatCompletionOptions & { signal?: AbortSignal }
  ): AsyncIterable<AIStreamChunk> {
    const stream = this.provider.streamResponse(messages, options);
    for await (const chunk of stream) {
      yield chunk;
    }
  }
}

export default AIOrchestrator;
