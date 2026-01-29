# EC2 Ollama integration

Your website uses a **backend proxy** to talk to Ollama on AWS EC2. The browser never calls EC2 directly.

---

## Where the integration lives

| Layer | Location | Role |
|-------|----------|------|
| **Frontend** | `src/pages/AssistantPage.tsx` | Chat UI: input, send button, loading state, error when AI is down. Calls backend only. |
| **Frontend API client** | `src/lib/ai.ts` | Sends requests to `/api/ai/chat` (and other AI routes). No EC2 URL or keys in the frontend. |
| **Backend routes** | `server/index.js` | `POST /api/ai/chat`, `POST /api/ai/generate`, etc. Receive user input and forward to Ollama. |
| **Ollama client** | `server/services/ollama.js` | Calls `OLLAMA_HOST` (e.g. `http://EC2_IP:11434/api/generate`) with `OLLAMA_MODEL`. Timeouts and errors handled here. |
| **Config** | `server/.env` | `OLLAMA_HOST`, `OLLAMA_MODEL` (and optional `OLLAMA_BACKUP_MODEL`). Not committed; copy from `server/.env.example`. |

Flow: **Browser → your backend (e.g. Express) → EC2 Ollama (port 11434)**. Only the backend talks to EC2.

---

## How to change the model later

1. **On EC2:** Pull the model you want:
   ```bash
   ssh your-ec2
   ollama pull llama3
   # or: ollama pull mistral, qwen2.5:0.5b, etc.
   ```

2. **In your backend env:** Set the model name in `server/.env`:
   ```env
   OLLAMA_MODEL=llama3
   ```
   Use the exact name returned by `ollama list` (e.g. `llama3`, `qwen2.5:0.5b`).

3. **Restart the backend** so it picks up the new env:
   ```bash
   cd server && npm run dev
   # or restart your process manager / systemd service
   ```

No code changes are required; only `OLLAMA_MODEL` (and optionally `OLLAMA_BACKUP_MODEL`) in `server/.env`.

---

## How to test it locally

You do **not** run Ollama on your laptop. Your **backend** runs locally and talks to **EC2 Ollama**.

1. **Create `server/.env`** (copy from `server/.env.example`):
   ```env
   OLLAMA_HOST=http://YOUR_EC2_PUBLIC_IP:11434
   OLLAMA_MODEL=llama3
   PORT=3001
   ```
   Replace `YOUR_EC2_PUBLIC_IP` with your EC2 instance’s public IP. Ensure EC2 security group allows **inbound TCP 11434** from your IP (or 0.0.0/0 only if you understand the risk).

2. **Start the backend** (from the project root or `server/`):
   ```bash
   cd server && npm install && npm run dev
   ```
   Backend will listen on port 3001 and use EC2 for all Ollama requests.

3. **Start the frontend** (from the project root):
   ```bash
   npm run dev
   ```
   Vite proxy will send `/api` to `http://localhost:3001`.

4. **Open the app** (e.g. http://localhost:8080) → go to **AI** in the nav → use the **Chat** tab. Type a message and send. You should see a loading state, then the reply from EC2 Ollama.

5. **If the AI is “unavailable”:**  
   - Backend not running → start it (step 2).  
   - EC2 unreachable → check `OLLAMA_HOST`, EC2 security group (11434), and that Ollama is running on EC2 (`systemctl status ollama`).  
   - Wrong model → set `OLLAMA_MODEL` to a model you’ve pulled on EC2 (`ollama list`).

---

## Security note

- **Do not expose port 11434 to the whole internet** unless you need to. Prefer restricting the security group to your backend server’s IP (or your dev IP when testing locally).
- The frontend never sees the EC2 IP or any API keys; only the backend uses `OLLAMA_HOST` and `OLLAMA_MODEL`.
