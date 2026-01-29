/**
 * Study Flow API - FREE AI backend.
 * - Text/reasoning: Ollama (POST /api/generate). Use EC2/VPS URL via OLLAMA_HOST.
 * - Vision: Gemini free tier only
 * - Semantic search: embeddings + SQLite (optional)
 *
 * For EC2: set OLLAMA_HOST=http://YOUR_EC2_PUBLIC_IP:11434 and OLLAMA_MODEL (e.g. llama3).
 * Backend proxies all AI requests; Ollama is never exposed directly to the browser.
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { createOllamaClient } from './services/ollama.js';
import { createGeminiVision } from './services/gemini-vision.js';
import * as vectorStore from './services/vectorStore.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Ollama URL: use EC2 public IP (e.g. http://3.12.45.67:11434). Never expose 11434 to browser.
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const ollama = createOllamaClient(OLLAMA_HOST);
const geminiVision = createGeminiVision(process.env.GEMINI_API_KEY);

app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

// Rate limiting: per IP, scalable and safe for multiple users
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 30,                   // 30 AI requests per minute per IP
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/ai', aiLimiter);
app.use('/api/search', aiLimiter);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ---------- Context-aware chat (Ollama) ----------
const SYSTEM_PROMPT = `You are a study and productivity coach. You have context about the user's current page, tasks, plans, goals, and progress. Use this context to give relevant, actionable advice. Be concise and supportive. Suggest next steps and warn about overload when appropriate.`;

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, userMessage, context } = req.body || {};
    if (!userMessage || typeof userMessage !== 'string') {
      return res.status(400).json({ error: 'userMessage required' });
    }
    const contextBlock = context
      ? `\n[Current context]\nPage: ${context.page || 'unknown'}\n${context.summary || 'No extra context.'}\n`
      : '';
    const systemContent = SYSTEM_PROMPT + contextBlock;
    const fullMessages = [
      { role: 'system', content: systemContent },
      ...(Array.isArray(messages) ? messages : []),
      { role: 'user', content: userMessage },
    ];
    const { content, error } = await ollama.chat(fullMessages);
    if (error) return res.status(502).json({ error, content: '' });
    res.json({ content });
  } catch (e) {
    res.status(500).json({ error: e.message, content: '' });
  }
});

// ---------- AI Plan Generator (Ollama) ----------
app.post('/api/ai/plan', async (req, res) => {
  try {
    const { goal, timeframe, hoursPerDay } = req.body || {};
    if (!goal || typeof goal !== 'string') {
      return res.status(400).json({ error: 'goal required' });
    }
    const prompt = `Create a realistic study/work plan as a structured list.

Goal: ${goal}
Timeframe: ${timeframe || 'Not specified'}
Available per day: ${hoursPerDay != null ? hoursPerDay + ' hours' : 'Not specified'}

Output a clear, numbered list of phases or weekly milestones with 3-7 concrete tasks per phase. Be realistic and actionable. Format for easy copy-paste into a task list.`;
    const { content, error } = await ollama.chat([
      { role: 'system', content: 'You output only the plan: concise, numbered list. No preamble.' },
      { role: 'user', content: prompt },
    ]);
    if (error) return res.status(502).json({ error, plan: '' });
    res.json({ plan: content || '', error: null });
  } catch (e) {
    res.status(500).json({ error: e.message, plan: '' });
  }
});

// ---------- AI Insights (Ollama) ----------
app.post('/api/ai/insights', async (req, res) => {
  try {
    const { summary } = req.body || {};
    const data = typeof summary === 'string' ? summary : 'No data provided.';
    const prompt = `Analyze this productivity/study snapshot and give short insights.

Data:
${data}

Provide: 1) 2-4 brief insights (patterns, strengths, risks). 2) One overload warning if relevant. 3) 1-2 optimization suggestions. Keep it scannable (bullets).`;
    const { content, error } = await ollama.chat([
      { role: 'system', content: 'You are a productivity analyst. Output only the analysis, no intro.' },
      { role: 'user', content: prompt },
    ]);
    if (error) return res.status(502).json({ error, insights: '' });
    res.json({ insights: content || '', error: null });
  } catch (e) {
    res.status(500).json({ error: e.message, insights: '' });
  }
});

// ---------- Image → structured text (Gemini vision) ----------
app.post('/api/ai/vision', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'image file required' });
    const { text, error } = await geminiVision.describeImage(
      req.file.buffer,
      req.file.mimetype || 'image/png'
    );
    if (error) return res.status(502).json({ error, text: '' });
    res.json({ text, structured: text, error: null });
  } catch (e) {
    res.status(500).json({ error: e.message, text: '' });
  }
});

// ---------- Semantic search (Ollama embed + SQLite) ----------
app.post('/api/search', async (req, res) => {
  try {
    const { q, limit, type } = req.body || {};
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'q (query) required' });
    }
    const { embedding, error: embedError } = await ollama.embed(q);
    if (embedError || !embedding.length) {
      return res.status(502).json({ error: embedError || 'Embed failed', results: [] });
    }
    const results = vectorStore.search(embedding, { limit: Math.min(Number(limit) || 10, 20), type });
    res.json({ results });
  } catch (e) {
    res.status(500).json({ error: e.message, results: [] });
  }
});

// ---------- Index content for semantic search (frontend sends items to index) ----------
app.post('/api/search/index', async (req, res) => {
  try {
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.json({ indexed: 0 });
    }
    let indexed = 0;
    for (const it of items) {
      const id = it.id && String(it.id);
      const type = (it.type && String(it.type)) || 'note';
      const text = (it.text && String(it.text)) || '';
      if (!id || !text) continue;
      const { embedding, error } = await ollama.embed(text);
      if (error || !embedding.length) continue;
      vectorStore.upsert(id, type, text, embedding, it.meta || {});
      indexed++;
    }
    res.json({ indexed });
  } catch (e) {
    res.status(500).json({ error: e.message, indexed: 0 });
  }
});

// ---------- Direct generate (prompt → AI text only) ----------
app.post('/api/ai/generate', async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (prompt == null || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt required' });
    }
    const { content, error } = await ollama.generate(prompt.trim() || 'Hi');
    if (error) return res.status(502).json({ error, text: '' });
    res.json({ text: content });
  } catch (e) {
    res.status(500).json({ error: e.message, text: '' });
  }
});

// ---------- Health (Ollama reachable) ----------
app.get('/api/health', async (_req, res) => {
  const { error } = await ollama.generate('Hi');
  res.json({ ok: !error, ollama: error ? error : 'ok' });
});

const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Study Flow API running at http://${HOST}:${PORT}`);
});
