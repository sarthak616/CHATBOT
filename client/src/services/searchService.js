const API_BASE = process.env.REACT_APP_API_URL || '/api';

/**
 * Stream search with proper SSE parsing
 */
export function streamSearch({ query, mode = 'research', conversationId, fileId, onSources, onChunk, onDone, onError }) {
  const token = localStorage.getItem('nexus_token');
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(`${API_BASE}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ query, mode, conversationId, fileId }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        onError?.(err.error || `Error: ${res.status}`);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const events = buffer.split('\n\n');
        buffer = events.pop() || ''; // Keep incomplete event

        for (const eventBlock of events) {
          const lines = eventBlock.split('\n');
          let eventType = 'message';
          let data = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              data = line.slice(6).trim();
            }
          }

          if (!data) continue;

          try {
            const parsed = JSON.parse(data);
            switch (eventType) {
              case 'sources': onSources?.(parsed.sources || []); break;
              case 'chunk': onChunk?.(parsed.text || ''); break;
              case 'done': onDone?.(parsed); break;
              case 'error': onError?.(parsed.error || 'Unknown error'); break;
              default: break;
            }
          } catch (_) {}
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        onError?.(err.message || 'Connection failed');
      }
    }
  })();

  return () => controller.abort();
}
