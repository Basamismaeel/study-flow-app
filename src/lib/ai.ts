/**
 * AI client - calls backend only. No API keys in frontend.
 * Backend runs on VPS and talks to Ollama (LLaMA 3.2) + Gemini free tier (vision).
 *
 * - Dev with proxy: leave VITE_API_URL unset → requests go to /api (Vite proxy to backend).
 * - Production / VPS: set VITE_API_URL to backend URL (e.g. https://api.yourdomain.com).
 */

const API_BASE = (import.meta.env.VITE_API_URL as string || '').replace(/\/$/, '') || '';
const API_PREFIX = API_BASE ? `${API_BASE}/api` : '/api';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIContext {
  page?: string;
  summary?: string;
}

/** Context-aware chat (Ollama) */
export async function sendChatMessage(
  messages: ChatMessage[],
  userMessage: string,
  context?: AIContext
): Promise<{ content: string; error?: string }> {
  try {
    const res = await fetch(`${API_PREFIX}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.filter((m) => m.role !== 'system'),
        userMessage,
        context: context || {},
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { content: '', error: data.error || `Request failed (${res.status})` };
    return { content: data.content ?? '', error: data.error };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Network error';
    return { content: '', error: message };
  }
}

/** AI plan generator (Ollama) */
export async function generatePlan(params: {
  goal: string;
  timeframe?: string;
  hoursPerDay?: number;
}): Promise<{ plan: string; error?: string }> {
  try {
    const res = await fetch(`${API_PREFIX}/ai/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { plan: '', error: data.error || `Request failed (${res.status})` };
    return { plan: data.plan ?? '', error: data.error };
  } catch (e) {
    return { plan: '', error: e instanceof Error ? e.message : 'Network error' };
  }
}

/** AI insights (Ollama) */
export async function getInsights(summary: string): Promise<{ insights: string; error?: string }> {
  try {
    const res = await fetch(`${API_PREFIX}/ai/insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { insights: '', error: data.error || `Request failed (${res.status})` };
    return { insights: data.insights ?? '', error: data.error };
  } catch (e) {
    return { insights: '', error: e instanceof Error ? e.message : 'Network error' };
  }
}

/** Image → structured text (Gemini vision, free tier) */
export async function imageToStructuredText(file: File): Promise<{ text: string; error?: string }> {
  try {
    const form = new FormData();
    form.append('image', file);
    const res = await fetch(`${API_PREFIX}/ai/vision`, {
      method: 'POST',
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { text: '', error: data.error || `Request failed (${res.status})` };
    return { text: data.text ?? '', error: data.error };
  } catch (e) {
    return { text: '', error: e instanceof Error ? e.message : 'Network error' };
  }
}

/** Semantic search (local embeddings + SQLite) */
export async function semanticSearch(
  query: string,
  opts?: { limit?: number; type?: string }
): Promise<{ results: Array<{ id: string; type: string; text: string; score: number; meta?: object }>; error?: string }> {
  try {
    const res = await fetch(`${API_PREFIX}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, ...opts }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { results: [], error: data.error || `Request failed (${res.status})` };
    return { results: data.results ?? [], error: data.error };
  } catch (e) {
    return { results: [], error: e instanceof Error ? e.message : 'Network error' };
  }
}

/** Index items for semantic search (frontend sends tasks/notes/plans/goals) */
export async function indexForSearch(
  items: Array<{ id: string; type: string; text: string; meta?: object }>
): Promise<{ indexed: number; error?: string }> {
  try {
    const res = await fetch(`${API_PREFIX}/search/index`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { indexed: 0, error: data.error };
    return { indexed: data.indexed ?? 0, error: data.error };
  } catch (e) {
    return { indexed: 0, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/** Check if backend is reachable (Ollama running) */
export async function isAiAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${API_PREFIX}/health`);
    const data = await res.json().catch(() => ({}));
    return data.ok === true;
  } catch {
    return false;
  }
}
