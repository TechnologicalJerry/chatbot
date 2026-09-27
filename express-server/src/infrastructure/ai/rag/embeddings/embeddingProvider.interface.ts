export interface IEmbeddingProvider {
  /**
   * Generates a vector embedding for a single text string.
   */
  embedText(text: string): Promise<number[]>;

  /**
   * Generates vector embeddings for a list of text strings in batch.
   */
  embedTexts(texts: string[]): Promise<number[][]>;
}
