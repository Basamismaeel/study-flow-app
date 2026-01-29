/**
 * Local vector store (SQLite + JSON embeddings).
 * FREE - no external services. Uses cosine similarity for search.
 */

import Database from 'better-sqlite3';
import { mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', 'data', 'vectors.db');

const dataDir = join(__dirname, '..', 'data');
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

const db = new Database(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    text TEXT NOT NULL,
    embedding TEXT NOT NULL,
    meta TEXT,
    created_at INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
`);

function cosineSimilarity(a, b) {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * @param {string} id
 * @param {string} type - 'task' | 'note' | 'plan' | 'goal'
 * @param {string} text
 * @param {number[]} embedding
 * @param {object} [meta]
 */
export function upsert(id, type, text, embedding, meta = {}) {
  const now = Date.now();
  const embJson = JSON.stringify(embedding);
  const metaJson = JSON.stringify(meta);
  const stmt = db.prepare(`
    INSERT INTO items (id, type, text, embedding, meta, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET type=?, text=?, embedding=?, meta=?, created_at=?
  `);
  stmt.run(id, type, text, embJson, metaJson, now, type, text, embJson, metaJson, now);
}

/**
 * @param {number[]} queryEmbedding
 * @param {{ limit?: number; type?: string }} [opts]
 */
export function search(queryEmbedding, opts = {}) {
  const { limit = 10, type } = opts;
  let rows = db.prepare('SELECT id, type, text, embedding, meta FROM items').all();
  if (type) rows = rows.filter((r) => r.type === type);
  const results = rows.map((r) => ({
    id: r.id,
    type: r.type,
    text: r.text,
    meta: r.meta ? JSON.parse(r.meta) : {},
    score: cosineSimilarity(queryEmbedding, JSON.parse(r.embedding)),
  }));
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

export function remove(id) {
  db.prepare('DELETE FROM items WHERE id = ?').run(id);
}
