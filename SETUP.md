# Study Flow – FREE AI Setup

**Critical:** AI does **not** run on the developer’s laptop. All AI (LLaMA 3.2 via Ollama) runs on a **VPS**. This keeps:

- Multiple users safe  
- The developer’s machine free  
- The site working when the developer is offline  

---

## Production (mandatory): VPS

**Full steps:** See **[VPS_SETUP.md](./VPS_SETUP.md)**.

Summary:

1. Create a **Linux VPS** (Ubuntu, ≥4 GB RAM).
2. On the VPS: **install Ollama**, bind it to **127.0.0.1:11434** (not public).
3. Pull models: `ollama pull llama3.2` and `ollama pull nomic-embed-text`.
4. Deploy the **Node backend** on the same VPS (e.g. `/opt/study-flow-server`).
5. Set **OLLAMA_HOST=http://127.0.0.1:11434** in `server/.env` on the VPS.
6. Open **only** the backend port (e.g. 3001) in the firewall; **do not** open 11434.
7. Point the **frontend** at the VPS API (e.g. `VITE_API_URL=http://YOUR_VPS_IP:3001` or your domain).

Security: **Ollama is never public.** Only the backend is exposed; it proxies to Ollama on localhost.

---

## Frontend (developer machine)

You only run the **frontend** locally. The frontend talks to the **VPS backend** (or a local backend for dev).

```bash
npm install
npm run dev
```

- **Production / VPS:** Set `VITE_API_URL` to your backend URL (e.g. `https://api.yourdomain.com`). Build: `npm run build`.
- **Local dev with VPS backend:** Set `VITE_API_URL=http://YOUR_VPS_IP:3001` in `.env`. Requests go to the VPS.
- **Local dev with local backend:** Don’t set `VITE_API_URL`. Run the backend locally (`cd server && npm run dev`). Vite proxy sends `/api` to `http://localhost:3001`.

---

## Backend env (on VPS)

In `server/.env` on the VPS:

```env
# VPS: Ollama on same machine (internal only)
OLLAMA_HOST=http://127.0.0.1:11434

# Optional: Gemini free tier for image understanding
GEMINI_API_KEY=

PORT=3001
```

---

## AI stack (free only)

| Component        | Where it runs | Service              |
|-----------------|---------------|----------------------|
| Text / reasoning| VPS only      | Ollama (LLaMA 3.2)   |
| Vision          | Backend (VPS) | Gemini free tier     |
| Semantic search | VPS           | Ollama embed + SQLite|

No OpenAI, no paid APIs, no AI on the developer’s device.
