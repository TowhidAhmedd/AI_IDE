
import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Globe, Trash2, Loader } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { API_BASE_URL } from "../config/api";

// ---------------- STREAM CHAT ----------------
async function streamChat(message, history, currentFile, currentCode, onChunk) {
  const res = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      history,
      current_file: currentFile,
      current_code: currentCode
    }),
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

// ---------------- WEB SEARCH ----------------
async function webSearch(query) {
  const res = await fetch(`${API_BASE_URL}/api/search-web`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })

  return res.json()
}

// ---------------- MESSAGE UI ----------------
function Message({ msg }) {
  const isUser = msg.role === 'user'

  return (
    <div className={`message ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-avatar">
        {isUser ? <User size={13} /> : <Bot size={13} />}
      </div>

      <div className="message-content">
        {isUser ? (
          <p>{msg.content}</p>
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {msg.content}
          </ReactMarkdown>
        )}

        {msg.sources?.length > 0 && (
          <div className="sources">
            <p>Sources</p>
            {msg.sources.map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noreferrer">
                {s.title || s.url}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------- MAIN COMPONENT ----------------
export default function ChatPanel({ currentFile, currentCode }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hi! I'm your AI assistant. Ask me anything about your code."
    }
  ])

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [webMode, setWebMode] = useState(false)

  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getHistory = () =>
    messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content
    }))

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      // ---------------- WEB MODE ----------------
      if (webMode) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: '🔍 Searching web...' }
        ])

        const result = await webSearch(userMsg)

        setMessages(prev => [
          ...prev.slice(0, -1),
          {
            role: 'assistant',
            content: result.answer || 'No result',
            sources: result.sources || []
          }
        ])
      }

      // ---------------- CHAT MODE ----------------
      else {
        let assistantContent = ''

        setMessages(prev => [...prev, { role: 'assistant', content: '' }])

        await streamChat(
          userMsg,
          getHistory(),
          currentFile?.name || '',
          currentCode || '',
          (chunk) => {
            assistantContent += chunk

            setMessages(prev => [
              ...prev.slice(0, -1),
              { role: 'assistant', content: assistantContent }
            ])
          }
        )
      }
    } catch (err) {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: `Error: ${err.message}` }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-panel">
      {/* HEADER */}
      <div className="panel-header">
        <div className="title">
          <Bot size={14} />
          <span>AI ASSISTANT</span>
        </div>

        <div className="actions">
          <button onClick={() => setWebMode(!webMode)}>
            <Globe size={13} />
          </button>

          <button onClick={() => setMessages([])}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* CHAT MESSAGES */}
      <div className="messages-container">
        {messages.map((msg, i) => (
          <Message key={i} msg={msg} />
        ))}

        {loading && <p>Typing...</p>}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="chat-input-area">
        {webMode && <span>🌐 Web Mode</span>}

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI..."
          disabled={loading}
        />

        <button onClick={handleSend} disabled={loading || !input.trim()}>
          {loading ? <Loader size={14} /> : <Send size={14} />}
        </button>
      </div>
    </div>
  )
}



// import React, { useState, useRef, useEffect } from 'react'
// import { Send, Bot, User, Globe, Trash2, Loader } from 'lucide-react'
// import ReactMarkdown from 'react-markdown'
// import remarkGfm from 'remark-gfm'

// import { API_BASE_URL } from "../config/api"; // edit only this line

// async function streamChat(message, history, currentFile, currentCode, onChunk) {
//   const res = await fetch('/api/chat', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ message, history, current_file: currentFile, current_code: currentCode }),
//   })
//   if (!res.ok) throw new Error(`HTTP ${res.status}`)
//   const reader = res.body.getReader()
//   const decoder = new TextDecoder()
//   let buffer = ''
//   while (true) {
//     const { done, value } = await reader.read()
//     if (done) break
//     buffer += decoder.decode(value, { stream: true })
//     const lines = buffer.split('\n')
//     buffer = lines.pop()
//     for (const line of lines) {
//       if (line.startsWith('data: ')) {
//         const data = line.slice(6).trim()
//         if (data === '[DONE]') return
//         try {
//           const parsed = JSON.parse(data)
//           if (parsed.content) onChunk(parsed.content)
//         } catch {}
//       }
//     }
//   }
// }

// async function webSearch(query) {
//   const res = await fetch('/api/search-web', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ query }),
//   })
//   return res.json()
// }

// function Message({ msg }) {
//   const isUser = msg.role === 'user'
//   return (
//     <div className={`message ${isUser ? 'user' : 'assistant'}`}>
//       <div className="message-avatar">
//         {isUser ? <User size={13} /> : <Bot size={13} />}
//       </div>
//       <div className="message-content">
//         {isUser ? (
//           <p>{msg.content}</p>
//         ) : (
//           <ReactMarkdown
//             remarkPlugins={[remarkGfm]}
//             components={{
//               code({ node, inline, className, children, ...props }) {
//                 const language = /language-(\w+)/.exec(className || '')?.[1] || ''
//                 if (!inline) {
//                   return (
//                     <div className="code-block">
//                       {language && <div className="code-lang">{language}</div>}
//                       <pre><code {...props}>{children}</code></pre>
//                     </div>
//                   )
//                 }
//                 return <code className="inline-code" {...props}>{children}</code>
//               }
//             }}
//           >
//             {msg.content}
//           </ReactMarkdown>
//         )}
//         {msg.sources?.length > 0 && (
//           <div className="sources">
//             <p className="sources-label">Sources</p>
//             {msg.sources.map((s, i) => (
//               <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="source-link">
//                 {s.title || s.url}
//               </a>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

// export default function ChatPanel({ currentFile, currentCode }) {
//   const [messages, setMessages] = useState([
//     {
//       role: 'assistant',
//       content: "Hi! I'm your AI coding assistant. I can see your current file and project context. Ask me anything, or use the editor buttons to explain, debug, or refactor code."
//     }
//   ])
//   const [input, setInput] = useState('')
//   const [loading, setLoading] = useState(false)
//   const [webMode, setWebMode] = useState(false)
//   const bottomRef = useRef(null)
//   const textareaRef = useRef(null)

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
//   }, [messages])

//   const getHistory = () =>
//     messages
//       .filter(m => m.role !== 'system')
//       .slice(-10)
//       .map(m => ({ role: m.role, content: m.content }))

//   const handleSend = async () => {
//     if (!input.trim() || loading) return
//     const userMsg = input.trim()
//     setInput('')
//     setMessages(prev => [...prev, { role: 'user', content: userMsg }])
//     setLoading(true)

//     try {
//       if (webMode) {
//         setMessages(prev => [...prev, { role: 'assistant', content: '🔍 Searching the web…' }])
//         const result = await webSearch(userMsg)
//         setMessages(prev => [
//           ...prev.slice(0, -1),
//           { role: 'assistant', content: result.answer, sources: result.sources }
//         ])
//       } else {
//         let assistantContent = ''
//         setMessages(prev => [...prev, { role: 'assistant', content: '' }])
//         await streamChat(
//           userMsg,
//           getHistory(),
//           currentFile?.name || '',
//           currentCode || '',
//           (chunk) => {
//             assistantContent += chunk
//             setMessages(prev => [
//               ...prev.slice(0, -1),
//               { role: 'assistant', content: assistantContent }
//             ])
//           }
//         )
//       }
//     } catch (err) {
//       setMessages(prev => [
//         ...prev.slice(0, -1),
//         { role: 'assistant', content: `Error: ${err.message}` }
//       ])
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleKeyDown = (e) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault()
//       handleSend()
//     }
//   }

//   return (
//     <div className="chat-panel">
//       <div className="panel-header">
//         <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
//           <Bot size={14} />
//           <span>AI ASSISTANT</span>
//         </div>
//         <div className="header-actions">
//           <button
//             className={`icon-btn ${webMode ? 'active' : ''}`}
//             title={webMode ? 'Switch to Chat' : 'Switch to Web Search'}
//             onClick={() => setWebMode(!webMode)}
//           >
//             <Globe size={13} />
//           </button>
//           <button className="icon-btn" title="Clear chat" onClick={() => setMessages([])}>
//             <Trash2 size={13} />
//           </button>
//         </div>
//       </div>

//       {currentFile && (
//         <div className="context-badge">
//           <span>📄 {currentFile.name}</span>
//         </div>
//       )}

//       <div className="messages-container">
//         {messages.map((msg, i) => (
//           <Message key={i} msg={msg} />
//         ))}
//         {loading && (
//           <div className="typing-indicator">
//             <span /><span /><span />
//           </div>
//         )}
//         <div ref={bottomRef} />
//       </div>

//       <div className="chat-input-area">
//         {webMode && (
//           <div className="mode-badge"><Globe size={11} /> Web Search</div>
//         )}
//         <div className="input-row">
//           <textarea
//             ref={textareaRef}
//             className="chat-input"
//             value={input}
//             onChange={e => setInput(e.target.value)}
//             onKeyDown={handleKeyDown}
//             placeholder={webMode ? 'Search the web…' : 'Ask AI anything… (Shift+Enter for newline)'}
//             rows={1}
//             disabled={loading}
//           />
//           <button
//             className="send-btn"
//             onClick={handleSend}
//             disabled={!input.trim() || loading}
//           >
//             {loading ? <Loader size={15} className="spin" /> : <Send size={15} />}
//           </button>
//         </div>
//       </div>
//     </div>
//   )
// }
