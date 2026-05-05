import React, { useState, useCallback } from 'react'
import FileExplorer from './components/FileExplorer.jsx'
import Editor from './components/Editor.jsx'
import ChatPanel from './components/ChatPanel.jsx'
import { Terminal, Settings, GitBranch, Search, Zap } from 'lucide-react'

const STYLES = `
  :root {
    --bg-base:        #0d0d0f;
    --bg-surface:     #131316;
    --bg-elevated:    #1a1a1f;
    --bg-hover:       #222228;
    --bg-active:      #2a2a32;
    --border:         #2a2a32;
    --border-focus:   #3d3d50;
    --text-primary:   #e2e2e5;
    --text-secondary: #9090a0;
    --text-muted:     #555565;
    --accent:         #7c6af7;
    --accent-dim:     rgba(124, 106, 247, 0.15);
    --accent-hover:   #6b5ae0;
    --green:          #4ade80;
    --red:            #f87171;
    --yellow:         #fbbf24;
    --mono:           'JetBrains Mono', 'Fira Code', monospace;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .app-shell {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--bg-base);
    color: var(--text-primary);
    font-family: 'Inter', sans-serif;
    font-size: 13px;
  }

  /* ── Title Bar ─────────────────────────────────────── */
  .title-bar {
    display: flex;
    align-items: center;
    height: 38px;
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border);
    padding: 0 12px;
    gap: 12px;
    flex-shrink: 0;
    user-select: none;
  }
  .title-logo {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    font-size: 13px;
    letter-spacing: 0.02em;
  }
  .title-logo .logo-icon {
    background: var(--accent);
    border-radius: 5px;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .title-logo span { color: var(--text-primary); }
  .title-logo em { color: var(--accent); font-style: normal; }
  .title-center {
    flex: 1;
    display: flex;
    justify-content: center;
  }
  .title-search {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 4px 12px;
    width: 280px;
    color: var(--text-muted);
    font-size: 12px;
    cursor: pointer;
    transition: border-color 0.15s;
  }
  .title-search:hover { border-color: var(--border-focus); }
  .title-right {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .status-pill {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 3px 8px;
    border-radius: 4px;
    background: var(--bg-elevated);
    color: var(--text-secondary);
    font-size: 11px;
    font-family: var(--mono);
  }
  .status-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--green);
    box-shadow: 0 0 4px var(--green);
  }

  /* ── Main Layout ────────────────────────────────────── */
  .main-area {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  /* ── Activity Bar ───────────────────────────────────── */
  .activity-bar {
    width: 44px;
    background: var(--bg-surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 0;
    gap: 4px;
    flex-shrink: 0;
  }
  .activity-btn {
    width: 36px; height: 36px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s;
  }
  .activity-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
  .activity-btn.active { background: var(--accent-dim); color: var(--accent); }
  .activity-spacer { flex: 1; }

  /* ── File Explorer ──────────────────────────────────── */
  .file-explorer {
    width: 220px;
    background: var(--bg-surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    overflow: hidden;
  }

  /* ── Shared panel header ────────────────────────────── */
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--text-muted);
    text-transform: uppercase;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .header-actions { display: flex; gap: 2px; }

  /* ── Tree ───────────────────────────────────────────── */
  .explorer-tree {
    overflow-y: auto;
    flex: 1;
    padding: 4px 0;
  }
  .explorer-tree::-webkit-scrollbar { width: 4px; }
  .explorer-tree::-webkit-scrollbar-track { background: transparent; }
  .explorer-tree::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .workspace-label {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px 8px;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .tree-item {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 3px 8px;
    cursor: pointer;
    border-radius: 4px;
    margin: 0 4px;
    transition: background 0.1s;
    font-family: var(--mono);
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tree-item:hover { background: var(--bg-hover); }
  .tree-item.selected { background: var(--accent-dim); color: var(--accent); }
  .tree-item.folder { color: var(--text-secondary); }
  .folder-icon { color: #7c9dbf; flex-shrink: 0; }
  .file-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* ── Icon buttons ───────────────────────────────────── */
  .icon-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }
  .icon-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
  .icon-btn.active { color: var(--accent); background: var(--accent-dim); }

  /* ── Editor ─────────────────────────────────────────── */
  .editor-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--bg-base);
  }

  .editor-tabs {
    display: flex;
    align-items: center;
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border);
    height: 36px;
    padding: 0 8px;
    gap: 8px;
    flex-shrink: 0;
  }
  .editor-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    font-family: var(--mono);
    font-size: 12px;
    border-radius: 5px;
    background: var(--bg-elevated);
    border: 1px solid transparent;
    color: var(--text-secondary);
    white-space: nowrap;
  }
  .editor-tab.active {
    background: var(--bg-active);
    border-color: var(--border-focus);
    color: var(--text-primary);
  }
  .tab-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--accent);
    opacity: 0.7;
  }

  .editor-actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 5px;
    border: 1px solid var(--border);
    background: var(--bg-elevated);
    color: var(--text-secondary);
    font-size: 11.5px;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .action-btn:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--accent-dim);
  }
  .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .action-btn.loading { border-color: var(--accent); color: var(--accent); }
  .action-btn.small { padding: 3px 8px; font-size: 11px; }

  .monaco-wrapper { flex: 1; overflow: hidden; }

  /* ── Output Panel ───────────────────────────────────── */
  .output-panel {
    border-top: 1px solid var(--border);
    background: var(--bg-surface);
    display: flex;
    flex-direction: column;
    max-height: 35vh;
    flex-shrink: 0;
  }
  .output-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
    border-bottom: 1px solid var(--border);
  }
  .output-content {
    flex: 1;
    overflow-y: auto;
    padding: 12px 16px;
    font-family: var(--mono);
    font-size: 12.5px;
    line-height: 1.6;
    color: var(--text-primary);
    white-space: pre-wrap;
    word-break: break-word;
  }
  .output-content::-webkit-scrollbar { width: 4px; }
  .output-content::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  /* ── Chat Panel ─────────────────────────────────────── */
  .chat-panel {
    width: 340px;
    background: var(--bg-surface);
    border-left: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    overflow: hidden;
  }

  .context-badge {
    padding: 4px 12px;
    background: var(--accent-dim);
    border-bottom: 1px solid var(--border);
    font-size: 10.5px;
    color: var(--accent);
    font-family: var(--mono);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 12px 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .messages-container::-webkit-scrollbar { width: 4px; }
  .messages-container::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .message {
    display: flex;
    gap: 8px;
    padding: 6px 12px;
    transition: background 0.1s;
  }
  .message:hover { background: var(--bg-hover); }
  .message.user .message-avatar { background: var(--accent-dim); color: var(--accent); }
  .message.assistant .message-avatar { background: var(--bg-elevated); color: var(--text-secondary); }
  .message-avatar {
    width: 24px; height: 24px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
  }
  .message-content {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    line-height: 1.6;
    color: var(--text-primary);
  }
  .message-content p { margin-bottom: 8px; }
  .message-content p:last-child { margin-bottom: 0; }
  .message-content h1, .message-content h2, .message-content h3 {
    margin: 10px 0 6px; font-size: 13px; font-weight: 600;
  }
  .message-content ul, .message-content ol {
    padding-left: 16px; margin-bottom: 8px;
  }
  .message-content li { margin-bottom: 2px; }

  .code-block {
    background: var(--bg-base);
    border: 1px solid var(--border);
    border-radius: 6px;
    margin: 8px 0;
    overflow: hidden;
  }
  .code-lang {
    padding: 3px 10px;
    background: var(--bg-elevated);
    font-size: 10px;
    font-family: var(--mono);
    color: var(--text-muted);
    border-bottom: 1px solid var(--border);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .code-block pre {
    padding: 10px 12px;
    overflow-x: auto;
    font-family: var(--mono);
    font-size: 12px;
    line-height: 1.55;
    color: #c9d1d9;
  }
  .code-block pre::-webkit-scrollbar { height: 4px; }
  .code-block pre::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
  .inline-code {
    background: var(--bg-elevated);
    padding: 1px 5px;
    border-radius: 3px;
    font-family: var(--mono);
    font-size: 11.5px;
    color: #c9d1d9;
  }

  .sources { margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border); }
  .sources-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 4px; }
  .source-link {
    display: block;
    font-size: 11px;
    color: var(--accent);
    text-decoration: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 2px;
  }
  .source-link:hover { text-decoration: underline; }

  .typing-indicator {
    display: flex;
    gap: 4px;
    padding: 8px 44px;
  }
  .typing-indicator span {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--text-muted);
    animation: bounce 1.2s infinite;
  }
  .typing-indicator span:nth-child(2) { animation-delay: 0.15s; }
  .typing-indicator span:nth-child(3) { animation-delay: 0.3s; }
  @keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-5px); }
  }

  /* ── Chat Input ─────────────────────────────────────── */
  .chat-input-area {
    border-top: 1px solid var(--border);
    padding: 10px;
    background: var(--bg-surface);
    flex-shrink: 0;
  }
  .mode-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    color: var(--accent);
    margin-bottom: 6px;
    padding: 2px 8px;
    background: var(--accent-dim);
    border-radius: 4px;
    width: fit-content;
  }
  .input-row {
    display: flex;
    gap: 6px;
    align-items: flex-end;
  }
  .chat-input {
    flex: 1;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 7px;
    padding: 8px 12px;
    color: var(--text-primary);
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    resize: none;
    outline: none;
    line-height: 1.5;
    max-height: 120px;
    overflow-y: auto;
    transition: border-color 0.15s;
  }
  .chat-input:focus { border-color: var(--border-focus); }
  .chat-input::placeholder { color: var(--text-muted); }
  .chat-input::-webkit-scrollbar { width: 4px; }
  .chat-input::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .send-btn {
    width: 34px; height: 34px;
    border-radius: 7px;
    border: none;
    background: var(--accent);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s;
  }
  .send-btn:hover:not(:disabled) { background: var(--accent-hover); }
  .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── Status Bar ─────────────────────────────────────── */
  .status-bar {
    height: 22px;
    background: var(--accent);
    display: flex;
    align-items: center;
    padding: 0 12px;
    gap: 16px;
    flex-shrink: 0;
  }
  .status-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: rgba(255,255,255,0.85);
    font-family: var(--mono);
  }
  .status-right { margin-left: auto; }

  /* ── Spinner ────────────────────────────────────────── */
  .spinner {
    width: 12px; height: 12px;
    border: 2px solid transparent;
    border-top-color: currentColor;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
  }
  .spin { animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
`

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [currentCode, setCurrentCode] = useState('')

  const handleFileSelect = useCallback((file) => {
    setSelectedFile(file)
    setCurrentCode(file.content || '')
  }, [])

  const handleCodeChange = useCallback((value) => {
    setCurrentCode(value || '')
  }, [])

  return (
    <>
      <style>{STYLES}</style>
      <div className="app-shell">
        {/* Title Bar */}
        <div className="title-bar">
          <div className="title-logo">
            <div className="logo-icon">
              <Zap size={12} color="white" />
            </div>
            <span>AI<em>IDE</em></span>
          </div>
          <div className="title-center">
            <div className="title-search">
              <Search size={12} />
              <span>Search files, commands… (⌘P)</span>
            </div>
          </div>
          <div className="title-right">
            <div className="status-pill">
              <div className="status-dot" />
              <span>Backend Connected</span>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="main-area">
          {/* Activity Bar */}
          <div className="activity-bar">
            <button className="activity-btn active" title="Explorer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3h7v7H3z"/><path d="M14 3h7v7h-7z"/><path d="M3 14h7v7H3z"/><path d="M14 14h7v7h-7z"/>
              </svg>
            </button>
            <button className="activity-btn" title="Search"><Search size={16} /></button>
            <button className="activity-btn" title="Source Control"><GitBranch size={16} /></button>
            <button className="activity-btn" title="Terminal"><Terminal size={16} /></button>
            <div className="activity-spacer" />
            <button className="activity-btn" title="Settings"><Settings size={16} /></button>
          </div>

          {/* File Explorer */}
          <FileExplorer onFileSelect={handleFileSelect} selectedFile={selectedFile} />

          {/* Editor */}
          <Editor
            file={selectedFile}
            onCodeChange={handleCodeChange}
          />

          {/* Chat Panel */}
          <ChatPanel
            currentFile={selectedFile}
            currentCode={currentCode}
          />
        </div>

        {/* Status Bar */}
        <div className="status-bar">
          <div className="status-item">
            <GitBranch size={11} /> main
          </div>
          <div className="status-item">
            {selectedFile ? selectedFile.language || 'plaintext' : 'No file open'}
          </div>
          <div className="status-item status-right">
            <Zap size={11} /> Groq · llama-3.3-70b
          </div>
        </div>
      </div>
    </>
  )
}
