import OpenAI from "openai";
import { IEmbeddingProvider } from "./embeddingProvider.interface";
import { env } from "../../../../config/env";
import { AppError } from "../../../../errors/appError";
import logger from "../../../logger/logger";
import { ragEmbeddingCounter, ragEmbeddingErrorsCounter } from "../../../metrics/metrics";

export class OpenAIEmbeddingProvider implements IEmbeddingProvider {
  private client: OpenAI | null = null;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    const key = apiKey !== undefined ? apiKey : env.OPENAI_API_KEY;
    this.model = model || env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

    if (key && key.trim() !== "") {
      this.client = new OpenAI({ apiKey: key });
    }
  }

  async embedText(text: string): Promise<number[]> {
    const results = await this.embedTexts([text]);
    return results[0] || [];
  }

  async embedTexts(texts: string[]): Promise<number[][]> {
    if (!this.client) {
      // In test mode or unconfigured key: fallback to deterministic pseudo-embeddings if client unconfigured
      if (env.NODE_ENV === "test" || !env.OPENAI_API_KEY) {
        return texts.map((t) => this.generateMockEmbedding(t));
      }
      throw AppError.badRequest(
        "OpenAI API key is missing for embeddings",
        undefined,
        "AI_CONFIGURATION_ERROR"
      );
    }

    if (texts.length === 0) return [];

    try {
      ragEmbeddingCounter.inc(texts.length);
      const response = await this.client.embeddings.create({
        model: this.model,
        input: texts,
      });

      return response.data.map((item) => item.embedding);
    } catch (err: any) {
      ragEmbeddingErrorsCounter.inc();
      logger.error({ err, model: this.model }, "OpenAI embedding generation failed");
      throw AppError.internal(`Embedding generation error: ${err.message}`);
    }
  }

  /**
   * Deterministic mock embedding for unit testing / offline mode.
   */
  private generateMockEmbedding(text: string): number[] {
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

export default OpenAIEmbeddingProvider;
