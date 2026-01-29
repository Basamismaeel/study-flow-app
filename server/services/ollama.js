/**
 * Ollama service - self-hosted AI via POST /api/generate.
 * Backend proxies to Ollama (e.g. EC2 at OLLAMA_HOST); endpoint never exposed to browser.
 * Model from env: OLLAMA_MODEL (e.g. llama3), optional OLLAMA_BACKUP_MODEL.
 */

const GENERATE_TIMEOUT_MS = 90_000;  // 90s for speed/low memory
const EMBED_TIMEOUT_MS = 60_000;

function fetchWithTimeout(url, options, timeoutMs) {
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), timeoutMs);
  return fetch(url, { ...options, signal: ac.signal }).finally(() => clearTimeout(to));
}

/**
 * Build a single prompt from chat messages (for /api/generate).
 * @param {Array<{ role: string; content: string }>} messages
 * @returns {string}
 */
function messagesToPrompt(messages) {
  return messages
    .map((m) => {
      const role = (m.role || 'user').toLowerCase();
      const label = role === 'system' ? 'System' : role === 'assistant' ? 'Assistant' : 'User';
      return `${label}: ${(m.content || '').trim()}`;
    })
    .join('\n\n')
    .trim();
}

/**
 * @param {string} baseUrl - e.g. http://localhost:11434
 * @param {{ model?: string; backupModel?: string; embedModel?: string }} [opts] - optional overrides; else from env
 */
export function createOllamaClient(baseUrl, opts = {}) {
  const host = (baseUrl || 'http://localhost:11434').replace(/\/$/, '');
  const model = opts.model || process.env.OLLAMA_MODEL || 'llama3';
  const backupModel = opts.backupModel || process.env.OLLAMA_BACKUP_MODEL || 'llama3.2';
  const embedModel = opts.embedModel || process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';

  /**
   * POST /api/generate - single prompt, returns AI text only.
   * @param {string} prompt
   * @param {string} useModel
   * @returns {Promise<{ content: string; error?: string }>}
   */
  async function doGenerate(prompt, useModel) {
    try {
      const res = await fetchWithTimeout(
        `${host}/api/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: useModel,
            prompt: String(prompt || '').trim() || 'Hi',
            stream: false,
          }),
        },
        GENERATE_TIMEOUT_MS
      );
      if (!res.ok) {
        const text = await res.text();
        return { content: '', error: `Ollama: ${res.status} ${text.slice(0, 200)}` };
      }
      const data = await res.json();
      const content = (data.response != null ? String(data.response) : '').trim();
      return { content };
    } catch (e) {
      const msg =
        e.name === 'AbortError' ? 'AI request timed out. Try again.' : (e.message || 'Ollama request failed.');
      return { content: '', error: msg };
    }
  }

  return {
    /**
     * Generate response for a single prompt. Tries backup model on failure.
     * @param {string} prompt
     * @returns {Promise<{ content: string; error?: string }>}
     */
    async generate(prompt) {
      const out = await doGenerate(prompt, model);
      if (!out.error) return out;
      return doGenerate(prompt, backupModel);
    },

    /**
     * Chat: build prompt from messages and call generate (for assistant, plan, insights).
     * @param {Array<{ role: string; content: string }>} messages
     * @returns {Promise<{ content: string; error?: string }>}
     */
    async chat(messages) {
      const prompt = messagesToPrompt(Array.isArray(messages) ? messages : []);
      return this.generate(prompt);
    },

    /**
     * Embeddings (for semantic search). Uses OLLAMA_EMBED_MODEL if set.
     * @param {string} text
     * @returns {Promise<{ embedding: number[]; error?: string }>}
     */
    async embed(text) {
      try {
        const res = await fetchWithTimeout(
          `${host}/api/embeddings`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: embedModel, prompt: String(text || '') }),
          },
          EMBED_TIMEOUT_MS
        );
        if (!res.ok) {
          const body = await res.text();
          return { embedding: [], error: `Ollama embed: ${res.status} ${body.slice(0, 100)}` };
        }
        const data = await res.json();
        const embedding = Array.isArray(data.embedding) ? data.embedding : [];
        return { embedding };
      } catch (e) {
        const msg = e.name === 'AbortError' ? 'Embedding timed out.' : (e.message || 'Embed failed');
        return { embedding: [], error: msg };
      }
    },
  };
}
