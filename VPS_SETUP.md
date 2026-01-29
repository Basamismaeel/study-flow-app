# VPS Setup – AI Server (Mandatory)

**Critical:** All AI computation (LLaMA 3.2 via Ollama) runs on a **VPS**, not on the developer’s laptop. This gives:

- Multiple users can use the AI safely  
- Developer’s device is not used for AI  
- The site works when the developer is offline  

---

## Architecture

```
[Users] → [Your Backend on VPS :3001] → [Ollama on VPS :11434, localhost only]
                ↑
         Only this is public.
         Port 11434 is NOT exposed.
```

- **VPS:** Runs Ollama + this Node backend on the same machine.
- **Backend:** Listens on a public port (e.g. 3001 or 80). Sends AI requests to `http://127.0.0.1:11434`.
- **Ollama:** Binds to `127.0.0.1:11434` only. No direct access from the internet.

---

## 1. Create a Linux VPS

- Provider: DigitalOcean, Linode, Vultr, AWS EC2, etc.
- **OS:** Ubuntu 22.04 LTS (or 24.04).
- **Size:** At least 4 GB RAM, 2 vCPU (8 GB recommended for LLaMA 3.2).
- Note the VPS **IP** and ensure you can SSH in: `ssh root@YOUR_VPS_IP`.

---

## 2. Install Ollama on the VPS

Run these on the VPS (Ubuntu).

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Ollama (official script)
curl -fsSL https://ollama.com/install.sh | sh
```

---

## 3. Bind Ollama to localhost only (security)

Ollama must **not** listen on a public interface. Only the backend on the same machine should reach it.

**Option A – systemd override (recommended)**

```bash
sudo mkdir -p /etc/systemd/system/ollama.service.d
sudo tee /etc/systemd/system/ollama.service.d/override.conf << 'EOF'
[Service]
Environment="OLLAMA_HOST=127.0.0.1:11434"
EOF
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

**Option B – if you start Ollama manually**

```bash
OLLAMA_HOST=127.0.0.1:11434 ollama serve
```

Check that Ollama is only on 127.0.0.1:

```bash
ss -tlnp | grep 11434
# Should show 127.0.0.1:11434, not 0.0.0.0:11434
```

---

## 4. Auto-start Ollama on reboot

```bash
sudo systemctl enable ollama
sudo systemctl start ollama
sudo systemctl status ollama
```

---

## 5. Pull LLaMA 3.2 and embedding model

```bash
# Chat / reasoning (required)
ollama pull llama3.2

# Embeddings (required for semantic search)
ollama pull nomic-embed-text
```

---

## 6. Install Node.js on the VPS

```bash
# Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # v20.x
```

---

## 7. Deploy the backend on the VPS

On your **local machine**, from the repo root:

```bash
# Copy server files to VPS (replace YOUR_VPS_IP and your user if not root)
scp -r server root@YOUR_VPS_IP:/opt/study-flow-server
```

On the **VPS**:

```bash
cd /opt/study-flow-server
npm install --production
```

Create env file on the VPS:

```bash
sudo nano /opt/study-flow-server/.env
```

Contents:

```env
# Ollama on same machine (internal only)
OLLAMA_HOST=http://127.0.0.1:11434

# Optional: Gemini free tier for image understanding
GEMINI_API_KEY=

# Backend port (this is the only public API)
PORT=3001
```

Save and exit.

---

## 8. Run the backend as a service (auto-start, restart)

On the **VPS**:

```bash
sudo tee /etc/systemd/system/study-flow-api.service << 'EOF'
[Unit]
Description=Study Flow API (AI backend)
After=network.target ollama.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/study-flow-server
ExecStart=/usr/bin/node index.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable study-flow-api
sudo systemctl start study-flow-api
sudo systemctl status study-flow-api
```

---

## 9. Firewall – expose only the backend

**Do not** open port 11434. Only the API port (e.g. 3001) or 80/443 if you put a reverse proxy in front.

```bash
# UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 3001/tcp
# If you use Nginx in front later: sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

---

## 10. Point the frontend to the VPS backend

Your frontend (Vite, Vercel, Netlify, etc.) must call the **VPS API**, not localhost.

**Option A – Vite dev (local frontend, VPS API)**

Create or edit `.env` in the **project root** (frontend):

```env
VITE_API_URL=http://YOUR_VPS_IP:3001
```

If your frontend uses `VITE_API_URL` for the base URL, set it in `src/lib/ai.ts` (e.g. `const API_BASE = import.meta.env.VITE_API_URL || '/api'`). Then in production, set `VITE_API_URL` to your real API URL (e.g. `https://api.yourdomain.com`).

**Option B – Same domain in production**

Deploy frontend and backend behind the same domain (e.g. Nginx reverse proxy):  
`https://yourdomain.com` → frontend, `https://yourdomain.com/api` → `http://127.0.0.1:3001`. Then the frontend can use relative `/api` and no env is needed.

---

## 11. Security (mandatory)

| Rule | Implementation |
|------|----------------|
| **Ollama port 11434 must NOT be public** | Ollama bound to `127.0.0.1:11434`; firewall does not open 11434. Only the backend on the same VPS talks to Ollama. |
| **Only backend is exposed** | Backend runs on the VPS and is the only service reachable from the internet (port 3001 or 80/443). |
| **Backend as secure proxy** | Users and the frontend call the backend only. The backend sends AI requests to `http://127.0.0.1:11434` internally. |
| **Environment variables** | `OLLAMA_HOST=http://127.0.0.1:11434` on the VPS. No AI endpoints or keys in the frontend. |
| **Rate limiting** | Backend uses `express-rate-limit`: 30 AI requests per minute per IP (configurable). |
| **Timeouts** | Ollama client: 2 min for chat, 1 min for embeddings; avoids hanging requests. |

---

## 12. Scalable behavior

- **Rate limiting:** 30 AI requests per minute per IP (configurable in `server/index.js`).
- **Timeouts:** Chat 120 s, embeddings 60 s (configurable in `server/services/ollama.js`).
- **Multiple users:** All go through the same backend; Ollama handles one request at a time per model (queue is in Ollama). For higher concurrency, consider multiple backends or a queue in front of Ollama (out of scope here).

---

## 13. Quick checklist

- [ ] VPS created (Ubuntu, ≥4 GB RAM)
- [ ] Ollama installed and bound to `127.0.0.1:11434`
- [ ] `ollama pull llama3.2` and `ollama pull nomic-embed-text`
- [ ] Ollama enabled and started: `systemctl enable ollama && systemctl start ollama`
- [ ] Backend deployed under `/opt/study-flow-server` with `.env` (`OLLAMA_HOST=http://127.0.0.1:11434`)
- [ ] Backend run as systemd service and enabled
- [ ] Firewall: only 22 and 3001 (or 80/443) open; 11434 not open
- [ ] Frontend uses VPS API URL (env or reverse proxy)

After this, **no AI runs on the developer’s laptop**; it all runs on the VPS.
