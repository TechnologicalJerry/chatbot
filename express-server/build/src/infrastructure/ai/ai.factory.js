"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAIOrchestrator = exports.setAIOrchestrator = void 0;
const ai_orchestrator_1 = require("./ai.orchestrator");
const openai_1 = __importDefault(require("openai"));
const env_1 = __importDefault(require("../../config/env"));
let currentOrchestrator = null;
class DefaultOpenAIProvider {
    client = null;
    constructor() {
        if (env_1.default.OPENAI_API_KEY && env_1.default.OPENAI_API_KEY !== "mock-key") {
            this.client = new openai_1.default({ apiKey: env_1.default.OPENAI_API_KEY });
        }
    }
    async generateCompletion(messages, options) {
        if (this.client) {
            const response = await this.client.chat.completions.create({
                model: options?.model || env_1.default.OPENAI_MODEL,
                messages: messages,
            });
            const choice = response.choices[0];
            return {
                id: response.id,
                message: {
                    role: "assistant",
                    content: choice.message.content || "",
                    tool_calls: choice.message.tool_calls,
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
    async *streamResponse(messages, options) {
        if (this.client) {
            const stream = await this.client.chat.completions.create({
                model: options?.model || env_1.default.OPENAI_MODEL,
                messages: messages,
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
function setAIOrchestrator(orchestrator) {
    currentOrchestrator = orchestrator;
}
exports.setAIOrchestrator = setAIOrchestrator;
function getAIOrchestrator() {
    if (currentOrchestrator) {
        return currentOrchestrator;
    }
    return new ai_orchestrator_1.AIOrchestrator(new DefaultOpenAIProvider());
}
exports.getAIOrchestrator = getAIOrchestrator;
