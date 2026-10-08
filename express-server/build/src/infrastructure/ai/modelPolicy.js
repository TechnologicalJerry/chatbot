"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enforceModelPolicy = void 0;
const env_1 = require("../../config/env");
const securityLogger_1 = require("../security/securityLogger");
function enforceModelPolicy(requestedModel, requestedMaxTokens) {
    const allowedList = (Array.isArray(env_1.env.AI_ALLOWED_MODELS) ? env_1.env.AI_ALLOWED_MODELS : String(env_1.env.AI_ALLOWED_MODELS).split(",")).map((m) => m.trim().toLowerCase());
    const defaultModel = env_1.env.OPENAI_MODEL;
    let selectedModel = defaultModel;
    if (requestedModel && requestedModel.trim()) {
        const cleanRequested = requestedModel.trim().toLowerCase();
        if (allowedList.includes(cleanRequested)) {
            selectedModel = requestedModel.trim();
        }
        else {
            (0, securityLogger_1.logSecurityEvent)({
                eventType: "AUTHORIZATION_FAILURE",
                details: { type: "unsupported_model_requested", requestedModel, fallback: defaultModel },
            });
            selectedModel = defaultModel;
        }
    }
    // Cap max output tokens against server configuration
    const maxOutputTokens = Math.min(requestedMaxTokens && requestedMaxTokens > 0 ? requestedMaxTokens : env_1.env.AI_MAX_OUTPUT_TOKENS, env_1.env.AI_MAX_OUTPUT_TOKENS);
    return {
        selectedModel,
        maxOutputTokens,
    };
}
exports.enforceModelPolicy = enforceModelPolicy;
