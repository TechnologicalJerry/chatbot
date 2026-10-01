export async function readSSEStream(
  baseUrl: string,
  conversationId: string,
  message: string,
  onChunk: (chunk: string) => void,
  onDone: (fullData: any) => void,
  onError: (err: any) => void,
) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('chatbot_token') : null;
  const encodedId = encodeURIComponent(conversationId);
  const encodedMsg = encodeURIComponent(message);
  const url = `${baseUrl}/api/v1/chat/stream?conversationId=${encodedId}&message=${encodedMsg}`;

  try {
    const response = await fetch(url, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || `SSE Request failed with status ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Response body reader unavailable');

    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let currentEvent = 'message';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('event:')) {
          currentEvent = trimmed.replace('event:', '').trim();
        } else if (trimmed.startsWith('data:')) {
          const rawData = trimmed.replace('data:', '').trim();
          try {
            const parsed = JSON.parse(rawData);
            if (currentEvent === 'chunk' && parsed.content) {
              onChunk(parsed.content);
            } else if (currentEvent === 'done') {
              onDone(parsed);
            }
          } catch {
            if (currentEvent === 'chunk') onChunk(rawData);
          }
        }
      }
    }
  } catch (err: any) {
    onError(err);
  }
}
