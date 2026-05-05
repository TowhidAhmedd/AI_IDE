# AI IDE — Production-Grade AI Coding Assistant

A Cursor-like AI IDE with a multi-agent backend (FastAPI + Groq) and a VS Code-style frontend (React + Monaco Editor).

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
│   ├── .env                     # Environment variables (fill in your keys)
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

Copy `backend/.env` and fill in your API keys:

```env
GROQ_API_KEY=your_groq_api_key_here       # https://console.groq.com
TAVILY_API_KEY=your_tavily_api_key_here   # https://app.tavily.com
```

**GROQ_API_KEY** — Powers all LLM inference (chat, code generation, debugging, refactoring, explanations). Uses `llama-3.3-70b-versatile` by default — extremely fast via Groq's LPU inference.

**TAVILY_API_KEY** — Powers the Research Agent and web search mode in the chat panel. Used only when you click the 🌐 button in chat or call `/api/search-web`.

---

## Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Fill in your API keys
nano .env

# Start the server
uvicorn main:app --reload --port 8000
```

The backend runs at **http://localhost:8000**
API docs available at **http://localhost:8000/docs**

---

## Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The frontend runs at **http://localhost:5173** and proxies `/api/*` to the backend.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Streaming chat with RAG context |
| POST | `/api/generate-code` | Generate code (streaming) |
| POST | `/api/debug` | Debug code with error message (streaming) |
| POST | `/api/refactor` | Refactor code (streaming) |
| POST | `/api/explain` | Explain code (streaming) |
| POST | `/api/search-web` | Web search via Tavily + AI synthesis |
| POST | `/api/plan` | Break task into sub-tasks (Planner Agent) |
| POST | `/api/index-file` | Index a file into the FAISS vector store |
| GET | `/api/index-stats` | RAG vector store stats |
| DELETE | `/api/index-clear` | Clear the vector store |
| GET | `/health` | Health check |

---

## Features

- **Monaco Editor** — Full VS Code editing experience with syntax highlighting for 15+ languages
- **Streaming Responses** — All AI responses stream token-by-token like Cursor
- **Multi-Agent System** — Planner, Coder, Debugger, and Researcher agents
- **RAG (Retrieval-Augmented Generation)** — FAISS vector store with sentence-transformer embeddings for context-aware AI
- **Code Injection** — AI-generated code can be injected directly into the editor
- **Web Search Mode** — Toggle 🌐 in chat to search the web via Tavily
- **Context-Aware Chat** — Chat panel always has access to current file name and content
- **AI Action Buttons** — Explain, Debug, Refactor, Generate code with one click (works on selected text or full file)

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
