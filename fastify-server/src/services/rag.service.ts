export class RagService {
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length || vecA.length === 0) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  generateMockEmbedding(text: string): number[] {
    const vector = new Array(16).fill(0);
    for (let i = 0; i < text.length; i++) {
      vector[i % 16] = (vector[i % 16] + text.charCodeAt(i)) % 100 / 100;
    }
    return vector;
  }
}
