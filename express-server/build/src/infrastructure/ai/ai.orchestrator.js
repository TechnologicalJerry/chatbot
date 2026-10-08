"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIOrchestrator = void 0;
const toolRegistry_1 = __importDefault(require("./tools/toolRegistry"));
const logger_1 = __importDefault(require("../logger/logger"));
const metrics_1 = require("../metrics/metrics");
class AIOrchestrator {
    provider;
    constructor(provider) {
        this.provider = provider;
    }
    async generateCompletion(messages, options) {
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
                        metrics_1.aiToolCallsCounter.inc({ tool: toolName });
                        let args = {};
                        try {
                            args = JSON.parse(toolCall.function.arguments || "{}");
                        }
                        catch { }
                        let output = "";
                        try {
                            const registry = toolRegistry_1.default.getInstance();
                            output = await registry.executeTool(toolName, args, {
                                userId: options?.executionContext?.userId,
                            });
                        }
                        catch (err) {
                            logger_1.default.error({ err, toolName }, "Tool execution failed in AIOrchestrator");
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
                metrics_1.aiRequestDurationHistogram.observe({ model }, duration);
                metrics_1.aiRequestsCounter.inc({ model, status: "success" });
                return result;
            }
            catch (err) {
                metrics_1.aiRequestsCounter.inc({ model, status: "error" });
                throw err;
            }
        }
        throw new Error("Maximum tool execution iterations exceeded");
    }
    async *streamCompletion(messages, options) {
        const stream = this.provider.streamResponse(messages, options);
        for await (const chunk of stream) {
            yield chunk;
        }
    }
}
exports.AIOrchestrator = AIOrchestrator;
exports.default = AIOrchestrator;
