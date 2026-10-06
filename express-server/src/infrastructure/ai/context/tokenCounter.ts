export function countTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

export function estimateMessageTokens(messages: { role: string; content: string }[]): number {
  let count = 0;
  for (const m of messages) {
    count += 4 + countTokens(m.content);
  }
  return count;
}

export class TokenCounter {
  static countTokens = countTokens;
  static estimateMessageTokens = estimateMessageTokens;
}

export default TokenCounter;
