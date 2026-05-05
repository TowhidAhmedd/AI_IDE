import React, { useRef, useCallback, useState } from 'react'
import MonacoEditor from '@monaco-editor/react'
import {
  Lightbulb, Bug, RefreshCw, Sparkles, X, Globe,
  Play, Copy, Check, ChevronDown
} from 'lucide-react'

const LANGUAGE_MAP = {
  py: 'python',
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  html: 'html',
  css: 'css',
  json: 'json',
  md: 'markdown',
  yaml: 'yaml',
  yml: 'yaml',
  sh: 'shell',
  rs: 'rust',
  go: 'go',
}

function getLanguage(filename) {
  if (!filename) return 'plaintext'
  const ext = filename.split('.').pop()
  return LANGUAGE_MAP[ext] || 'plaintext'
}

async function streamRequest(endpoint, body, onChunk) {
  const res = await fetch(`/api${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim()
        if (data === '[DONE]') return
        try {
          const parsed = JSON.parse(data)
          if (parsed.content) onChunk(parsed.content)
        } catch {}
      }
    }
  }
}

function OutputPanel({ result, onClose, onInject }) {
  const [copied, setCopied] = useState(false)

  const codeMatch = result.match(/```[\w]*\n([\s\S]*?)```/)
  const codeContent = codeMatch ? codeMatch[1] : null

  const handleCopy = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="output-panel">
      <div className="output-header">
        <span>AI Output</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {codeContent && (
            <button className="action-btn small" onClick={() => onInject(codeContent)}>
              <Play size={12} /> Inject to Editor
            </button>
          )}
          <button className="icon-btn" onClick={handleCopy}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
          <button className="icon-btn" onClick={onClose}><X size={13} /></button>
        </div>
      </div>
      <pre className="output-content">{result}</pre>
    </div>
  )
}

export default function Editor({ file, onCodeChange }) {
  const editorRef = useRef(null)
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(null)
  const [showOutput, setShowOutput] = useState(false)
  const [activeAction, setActiveAction] = useState(null)

  const getCode = () => editorRef.current?.getValue() || ''
  const getSelection = () => {
    const editor = editorRef.current
    if (!editor) return ''
    const sel = editor.getSelection()
    if (!sel || sel.isEmpty()) return getCode()
    return editor.getModel()?.getValueInRange(sel) || getCode()
  }

  const runAction = useCallback(async (actionId, endpoint, body) => {
    setLoading(actionId)
    setOutput('')
    setShowOutput(true)
    try {
      await streamRequest(endpoint, body, (chunk) => {
        setOutput(prev => prev + chunk)
      })
    } catch (err) {
      setOutput(`Error: ${err.message}`)
    } finally {
      setLoading(null)
    }
  }, [])

  const handleExplain = () => {
    const code = getSelection()
    runAction('explain', '/explain', { code })
  }

  const handleDebug = () => {
    const code = getSelection()
    runAction('debug', '/debug', { code, error: '', current_file: file?.name || '' })
  }

  const handleRefactor = () => {
    const code = getSelection()
    runAction('refactor', '/refactor', { code, instructions: '' })
  }

  const handleGenerate = () => {
    const task = window.prompt('Describe what code to generate:')
    if (!task) return
    runAction('generate', '/generate-code', {
      task,
      language: getLanguage(file?.name || ''),
      current_file: file?.name || '',
      current_code: getCode(),
    })
  }

  const handleInject = (code) => {
    const editor = editorRef.current
    if (!editor) return
    const sel = editor.getSelection()
    if (sel && !sel.isEmpty()) {
      editor.executeEdits('ai-inject', [{ range: sel, text: code }])
    } else {
      const model = editor.getModel()
      const lastLine = model.getLineCount()
      const lastCol = model.getLineMaxColumn(lastLine)
      editor.executeEdits('ai-inject', [{
        range: { startLineNumber: lastLine, startColumn: lastCol, endLineNumber: lastLine, endColumn: lastCol },
        text: '\n\n' + code
      }])
    }
    onCodeChange?.(editor.getValue())
  }

  const ACTIONS = [
    { id: 'explain', label: 'Explain', icon: <Lightbulb size={13} />, handler: handleExplain },
    { id: 'debug', label: 'Debug', icon: <Bug size={13} />, handler: handleDebug },
    { id: 'refactor', label: 'Refactor', icon: <RefreshCw size={13} />, handler: handleRefactor },
    { id: 'generate', label: 'Generate', icon: <Sparkles size={13} />, handler: handleGenerate },
  ]

  return (
    <div className="editor-container">
      {/* Tab bar */}
      <div className="editor-tabs">
        {file && (
          <div className="editor-tab active">
            <span className="tab-dot" />
            <span>{file.name}</span>
          </div>
        )}
        <div className="editor-actions">
          {ACTIONS.map(a => (
            <button
              key={a.id}
              className={`action-btn ${loading === a.id ? 'loading' : ''}`}
              onClick={a.handler}
              disabled={!!loading}
              title={a.label}
            >
              {loading === a.id ? <span className="spinner" /> : a.icon}
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Monaco */}
      <div className="monaco-wrapper">
        <MonacoEditor
          height="100%"
          language={getLanguage(file?.name || '')}
          value={file?.content || '// Open a file from the explorer\n'}
          theme="vs-dark"
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            minimap: { enabled: true, scale: 0.8 },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            padding: { top: 16, bottom: 16 },
            tabSize: 2,
            wordWrap: 'off',
            bracketPairColorization: { enabled: true },
            guides: { bracketPairs: true },
          }}
          onMount={(editor) => {
            editorRef.current = editor
          }}
          onChange={(value) => onCodeChange?.(value)}
        />
      </div>

      {/* Output panel */}
      {showOutput && (
        <OutputPanel
          result={output || (loading ? 'Generating…' : '')}
          onClose={() => { setShowOutput(false); setOutput('') }}
          onInject={handleInject}
        />
      )}
    </div>
  )
}
