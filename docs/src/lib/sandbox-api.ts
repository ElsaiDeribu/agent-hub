import { HOST_API } from '@/config-global';

export type ChatHistoryMessage = { role: string; content: string };

export type SandboxAgentMeta = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  starterMessages?: string[];
  tags?: string[];
  frameworks?: string[];
};

function apiBase(): string {
  const base = HOST_API?.replace(/\/$/, '') || 'http://localhost:8000';
  return base;
}

async function readError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { detail?: string | { msg?: string }[] };
    if (typeof data.detail === 'string') return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail.map((d) => d.msg ?? JSON.stringify(d)).join('; ');
    }
    return res.statusText || `HTTP ${res.status}`;
  } catch {
    return res.statusText || `HTTP ${res.status}`;
  }
}

export async function listSandboxAgents(): Promise<SandboxAgentMeta[]> {
  const res = await fetch(`${apiBase()}/registry`);
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function createSession(
  agentId: string
): Promise<{ session_id: string; status: string }> {
  const res = await fetch(`${apiBase()}/sessions/${encodeURIComponent(agentId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // No model API keys — preview agents are mock/deterministic.
    body: JSON.stringify({ env: {} }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function deleteSession(sessionId: string): Promise<void> {
  const res = await fetch(`${apiBase()}/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(await readError(res));
  }
}

export type StreamEvent =
  | { type: 'token'; content: string }
  | { type: 'done' }
  | { type: 'error'; content: string };

/**
 * Stream chat SSE from the sandbox proxy. Calls onEvent for each parsed frame.
 */
export async function streamChat(
  sessionId: string,
  message: string,
  history: ChatHistoryMessage[],
  onEvent: (event: StreamEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(`${apiBase()}/sessions/${encodeURIComponent(sessionId)}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
    signal,
  });

  if (!res.ok) {
    throw new Error(await readError(res));
  }
  if (!res.body) {
    throw new Error('No response body from chat endpoint');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';

    for (const part of parts) {
      for (const line of part.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const event = JSON.parse(payload) as StreamEvent;
          onEvent(event);
        } catch {
          // ignore malformed frames
        }
      }
    }
  }
}
