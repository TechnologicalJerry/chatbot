import { describe, it, expect, beforeEach } from 'vitest';
import { RagService } from './rag.service';

describe('RagService', () => {
  let service: RagService;

  beforeEach(() => {
    service = new RagService();
  });

  it('should calculate cosine similarity between identical vectors', () => {
    const vec = [1, 2, 3, 4];
    const sim = service.cosineSimilarity(vec, vec);
    expect(sim).toBeCloseTo(1.0);
  });

  it('should generate mock embedding vector', () => {
    const embed = service.generateMockEmbedding('test text');
    expect(embed.length).toBe(16);
  });
});
