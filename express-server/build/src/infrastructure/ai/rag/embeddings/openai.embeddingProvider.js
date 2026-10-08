"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIEmbeddingProvider = void 0;
const openai_1 = __importDefault(require("openai"));
const env_1 = require("../../../../config/env");
const appError_1 = require("../../../../errors/appError");
const logger_1 = __importDefault(require("../../../logger/logger"));
const metrics_1 = require("../../../metrics/metrics");
class OpenAIEmbeddingProvider {
    client = null;
    model;
    constructor(apiKey, model) {
        const key = apiKey !== undefined ? apiKey : env_1.env.OPENAI_API_KEY;
        this.model = model || env_1.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
        if (key && key.trim() !== "") {
            this.client = new openai_1.default({ apiKey: key });
        }
    }
    async embedText(text) {
        const results = await this.embedTexts([text]);
        return results[0] || [];
    }
    async embedTexts(texts) {
        if (!this.client) {
            // In test mode or unconfigured key: fallback to deterministic pseudo-embeddings if client unconfigured
            if (env_1.env.NODE_ENV === "test" || !env_1.env.OPENAI_API_KEY) {
                return texts.map((t) => this.generateMockEmbedding(t));
            }
            throw appError_1.AppError.badRequest("OpenAI API key is missing for embeddings");
        }
        if (texts.length === 0)
            return [];
        try {
            metrics_1.ragEmbeddingCounter.inc(texts.length);
            const response = await this.client.embeddings.create({
                model: this.model,
                input: texts,
            });
            return response.data.map((item) => item.embedding);
        }
        catch (err) {
            metrics_1.ragEmbeddingErrorsCounter.inc();
            logger_1.default.error({ err, model: this.model }, "OpenAI embedding generation failed");
            throw appError_1.AppError.internal(`Embedding generation error: ${err.message}`);
        }
    }
    /**
     * Deterministic mock embedding for unit testing / offline mode.
     */
    generateMockEmbedding(text) {
        const dim = 1536;
        const vec = new Array(dim).fill(0);
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            hash = (hash << 5) - hash + text.charCodeAt(i);
            hash |= 0;
        }
        const val = Math.sin(hash) * 0.5;
        for (let i = 0; i < dim; i++) {
            vec[i] = Math.sin(hash + i) * 0.1;
        }
        vec[0] = val;
        return vec;
    }
}
exports.OpenAIEmbeddingProvider = OpenAIEmbeddingProvider;
exports.default = OpenAIEmbeddingProvider;
