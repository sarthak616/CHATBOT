import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// Attach JWT to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('nexus_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401s globally
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('nexus_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

/**
 * Stream a search query using SSE
 * @param {Object} params
 * @param {Function} params.onSources - Called with sources array
 * @param {Function} params.onChunk - Called with text chunk
 * @param {Function} params.onDone - Called with { conversationId, latencyMs }
 * @param {Function} params.onError - Called with error
 * @returns {Function} abort function
 */
export function streamSearch({ query, mode, conversationId, fileId, onSources, onChunk, onDone, onError }) {
  const token = localStorage.getItem('nexus_token');

  const controller = new AbortController();

  fetch(`${API_BASE}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ query, mode, conversationId, fileId }),
    signal: controller.signal,
  }).then(async res => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Search failed' }));
      onError?.(err.error || 'Search failed');
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          // handled with next data line
        } else if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            // Look for the event type in previous lines
            const eventLine = lines[lines.indexOf(line) - 1];
            const event = eventLine?.startsWith('event: ') ? eventLine.slice(7) : 'message';

            if (event === 'sources') onSources?.(data.sources);
            else if (event === 'chunk') onChunk?.(data.text);
            else if (event === 'done') onDone?.(data);
            else if (event === 'error') onError?.(data.error);
          } catch (_) {}
        }
      }
    }
  }).catch(err => {
    if (err.name !== 'AbortError') {
      onError?.(err.message || 'Connection failed');
    }
  });

  // Better SSE parsing using EventSource-like approach
  return () => controller.abort();
}

export default api;
