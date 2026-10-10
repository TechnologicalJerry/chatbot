import { env } from "../../config/env";
import { logSecurityEvent } from "../security/securityLogger";

export interface AllowedModelPolicy {
  selectedModel: string;
  maxOutputTokens: number;
}

export function enforceModelPolicy(requestedModel?: string, requestedMaxTokens?: number): AllowedModelPolicy {
  const allowedList = (Array.isArray(env.AI_ALLOWED_MODELS) ? env.AI_ALLOWED_MODELS : String(env.AI_ALLOWED_MODELS).split(",")).map((m: string) => m.trim().toLowerCase());
  const defaultModel = env.OPENAI_MODEL;

  let selectedModel = defaultModel;

  if (requestedModel && requestedModel.trim()) {
    const cleanRequested = requestedModel.trim().toLowerCase();
    if (allowedList.includes(cleanRequested)) {
      selectedModel = requestedModel.trim();
    } else {
      logSecurityEvent({
        eventType: "AUTHORIZATION_FAILURE",
        details: { type: "unsupported_model_requested", requestedModel, fallback: defaultModel },
      });
      selectedModel = defaultModel;
    }
  }

  // Cap max output tokens against server configuration
  const maxOutputTokens = Math.min(
    requestedMaxTokens && requestedMaxTokens > 0 ? requestedMaxTokens : env.AI_MAX_OUTPUT_TOKENS,
    env.AI_MAX_OUTPUT_TOKENS
  );

  return {
    selectedModel,
    maxOutputTokens,
  };
}
