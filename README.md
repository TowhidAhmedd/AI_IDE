# AI IDE — Production-Grade AI Coding Assistant

> A Cursor-like AI IDE with a multi-agent backend (FastAPI + Groq) and a VS Code-style frontend (React + Monaco Editor), deployed on Render.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Deploying to Render](#deploying-to-render)
  - [Prerequisites](#prerequisites)
  - [1. Deploy the Backend (FastAPI)](#1-deploy-the-backend-fastapi)
  - [2. Deploy the Frontend (React + Vite)](#2-deploy-the-frontend-react--vite)
  - [3. Connect Frontend to Backend](#3-connect-frontend-to-backend)
  - [render.yaml — Infrastructure as Code](#renderyaml--infrastructure-as-code)
  - [Deployment Notes & Gotchas](#deployment-notes--gotchas)
- [API Reference](#api-reference)
- [Tech Stack](#tech-stack)

---

## Features

- **Monaco Editor** — Full VS Code editing experience with syntax highlighting for 15+ languages
- **Streaming Responses** — All AI responses stream token-by-token via SSE, just like Cursor
- **Multi-Agent System** — Planner, Coder, Debugger, and Researcher agents
- **RAG Pipeline** — FAISS vector store with SentenceTransformer embeddings for context-aware AI responses
- **Code Injection** — AI-generated code injected directly into the editor with one click
- **Web Search Mode** — Toggle 🌐 in chat to search the web in real-time via Tavily
- **Context-Aware Chat** — Chat always has access to the current file name and content

---

## Architecture

```
User → React Frontend (Monaco + Chat)
         ↓ SSE streaming
    FastAPI Backend
         ↓
    ┌────────────────────────┐
    │   Multi-Agent Layer    │
    │  Planner │ Coder       │
    │  Debugger│ Researcher  │
    └────────────────────────┘
         ↓                ↓
    Groq API          Tavily API
    (LLM inference)   (web search)
         ↑
    RAG Layer (FAISS + SentenceTransformers)
```

---

## Project Structure

```
ai-ide/
├── backend/
│   ├── main.py                  # FastAPI app entrypoint
│   ├── agents/
│   │   ├── planner.py           # Planner agent (decomposes tasks)
│   │   ├── coder.py             # Coder agent (writes/refactors/explains code)
│   │   ├── debugger.py          # Debugger agent (fixes bugs)
│   │   └── researcher.py        # Research agent (Tavily web search)
│   ├── rag/
│   │   ├── vector_store.py      # FAISS vector store singleton
│   │   └── embedder.py          # SentenceTransformer embeddings
│   ├── services/
│   │   ├── groq_client.py       # Groq API client (streaming + non-streaming)
│   │   └── tavily_client.py     # Tavily search API client
│   ├── routes/
│   │   ├── chat.py              # /api/chat — streaming chat endpoint
│   │   └── code.py              # /api/generate-code, /debug, /refactor, etc.
│   ├── utils/
│   │   └── file_loader.py       # File reading + text chunking utilities
│   ├── .env                     # Environment variables (never commit this)
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx              # Root layout + global styles
    │   └── components/
    │       ├── Editor.jsx       # Monaco editor + AI action buttons
    │       ├── ChatPanel.jsx    # Streaming AI chat + web search mode
    │       └── FileExplorer.jsx # Mock file tree workspace
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Environment Variables

Create a `backend/.env` file and populate with your API keys:

```env
GROQ_API_KEY=your_groq_api_key_here       # https://console.groq.com
TAVILY_API_KEY=your_tavily_api_key_here   # https://app.tavily.com
```

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | ✅ Yes | Powers all LLM inference via `llama-3.3-70b-versatile` on Groq's LPU |
| `TAVILY_API_KEY` | ⚡ Optional | Required only for web search mode and the Research Agent |

> **Security**: Never commit `.env` to version control. Add it to `.gitignore`.

---

## Local Development

### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
nano .env                        # Add your API keys

# Start the dev server
uvicorn main:app --reload --port 8000
```

Backend runs at: **http://localhost:8000**  
Interactive API docs: **http://localhost:8000/docs**

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: **http://localhost:5173**  
All `/api/*` requests are proxied to the backend via `vite.config.js`.

---

## Deploying to Render

Render hosts both services — a **Web Service** for the FastAPI backend and a **Static Site** for the React frontend. The backend runs on Render's managed Python runtime; the frontend is built and served from Render's global CDN.

### Prerequisites

- A [Render account](https://render.com) (free tier works)
- Your project pushed to a GitHub or GitLab repository
- `GROQ_API_KEY` and `TAVILY_API_KEY` ready

---

### 1. Deploy the Backend (FastAPI)

1. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Web Service**
2. Connect your GitHub repository
3. Configure the service:

| Setting | Value |
|---|---|
| **Name** | `ai-ide-backend` |
| **Region** | Choose closest to your users |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | Free (or Starter for production) |

4. Under **Environment Variables**, add:

```
GROQ_API_KEY      = your_groq_api_key_here
TAVILY_API_KEY    = your_tavily_api_key_here
```

5. Click **Create Web Service**

Render will build and deploy the backend. Note the assigned URL — it will look like:
```
https://ai-ide-backend.onrender.com
```

> **Cold Starts on Free Tier**: Render's free tier spins down services after 15 minutes of inactivity. The first request after a cold start may take 30–60 seconds. Upgrade to a paid instance to avoid this in production.

---

### 2. Deploy the Frontend (React + Vite)

Before deploying, set the backend URL as an environment variable used during the Vite build:

**`frontend/.env.production`**
```env
VITE_API_BASE_URL=https://ai-ide-backend.onrender.com
```

Make sure your frontend API calls reference this variable:
```js
// Example usage in your fetch/axios calls
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
```

Then deploy:

1. Go to Render Dashboard → **New** → **Static Site**
2. Connect the same GitHub repository
3. Configure the site:

| Setting | Value |
|---|---|
| **Name** | `ai-ide-frontend` |
| **Branch** | `main` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

4. Under **Environment Variables**, add:

```
VITE_API_BASE_URL = https://ai-ide-backend.onrender.com
```

5. Click **Create Static Site**

Your frontend will be live at:
```
https://ai-ide-frontend.onrender.com
```

---

### 3. Connect Frontend to Backend

Update `vite.config.js` so the proxy only applies in local development. In production, requests go directly to the backend URL via `VITE_API_BASE_URL`:

```js
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

In your API utility, resolve the base URL at runtime:

```js
// src/lib/api.js
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export const fetchStream = (endpoint, body) =>
  fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
```

**Enable CORS on the backend** so the frontend domain is whitelisted:

```python
# backend/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://ai-ide-frontend.onrender.com",  # your Render frontend URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### `render.yaml` — Infrastructure as Code

For one-click deployments, add a `render.yaml` at the root of your repository. Render will auto-detect it and provision all services:

```yaml
# render.yaml  (place at repo root)

services:
  # ── Backend ──────────────────────────────────────────────
  - type: web
    name: ai-ide-backend
    runtime: python
    rootDir: backend
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: GROQ_API_KEY
        sync: false          # Render will prompt for this secret on first deploy
      - key: TAVILY_API_KEY
        sync: false
    healthCheckPath: /health

  # ── Frontend ─────────────────────────────────────────────
  - type: web
    name: ai-ide-frontend
    runtime: static
    rootDir: frontend
    buildCommand: npm install && npm run build
    staticPublishPath: dist
    envVars:
      - key: VITE_API_BASE_URL
        value: https://ai-ide-backend.onrender.com
    routes:
      - type: rewrite
        source: /*
        destination: /index.html    # Required for client-side routing (SPA)
```

Push `render.yaml` to your repo, then go to **Render Dashboard → New → Blueprint** and connect your repository. Render will provision both services automatically.

---

### Deployment Notes & Gotchas

| Topic | Notes |
|---|---|
| **SSE Streaming** | Render supports Server-Sent Events. No additional config needed, but ensure `Content-Type: text/event-stream` is set correctly in your FastAPI streaming routes. |
| **FAISS + SentenceTransformers** | These are CPU-bound. On Render's free tier, model loading on cold start may take ~20–30s. Consider pre-warming by calling `/health` on startup. |
| **Ephemeral Filesystem** | Render's free instances have an ephemeral disk. The FAISS index is lost on every redeploy/restart. For persistence, use Render Disks (paid) or an external vector DB like Pinecone or Qdrant. |
| **Free Tier Limits** | Free Web Services spin down after 15 min of inactivity. Static Sites are always-on and free. |
| **Build Timeout** | `sentence-transformers` can be slow to install. If builds time out, use a pre-built Docker image or upgrade to a paid instance. |
| **Secrets** | Never hardcode API keys. Always use Render's **Environment Variables** panel or `render.yaml` with `sync: false`. |
| **Custom Domain** | Render supports custom domains with auto-provisioned TLS on all paid plans. Configure under **Settings → Custom Domains** on each service. |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat` | Streaming chat with RAG context |
| `POST` | `/api/generate-code` | Generate code (streaming) |
| `POST` | `/api/debug` | Debug code with error message (streaming) |
| `POST` | `/api/refactor` | Refactor code (streaming) |
| `POST` | `/api/explain` | Explain code (streaming) |
| `POST` | `/api/search-web` | Web search via Tavily + AI synthesis |
| `POST` | `/api/plan` | Break task into sub-tasks (Planner Agent) |
| `POST` | `/api/index-file` | Index a file into the FAISS vector store |
| `GET` | `/api/index-stats` | RAG vector store stats |
| `DELETE` | `/api/index-clear` | Clear the vector store |
| `GET` | `/health` | Health check |

Full interactive docs available at `/docs` (Swagger UI) and `/redoc`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **LLM Inference** | [Groq](https://console.groq.com) — `llama-3.3-70b-versatile` |
| **Web Search** | [Tavily](https://app.tavily.com) |
| **Vector Store** | [FAISS](https://github.com/facebookresearch/faiss) |
| **Embeddings** | [SentenceTransformers](https://www.sbert.net) |
| **Backend** | [FastAPI](https://fastapi.tiangolo.com) + Uvicorn |
| **Frontend** | [React](https://react.dev) + [Vite](https://vitejs.dev) |
| **Editor** | [Monaco Editor](https://microsoft.github.io/monaco-editor/) |
| **Hosting** | [Render](https://render.com) |

---

## License

MIT License — see [LICENSE](LICENSE) for details.
