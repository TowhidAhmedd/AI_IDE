import React, { useState } from 'react'
import { ChevronDown, ChevronRight, File, Folder, FolderOpen, Plus, RefreshCw } from 'lucide-react'

const MOCK_WORKSPACE = {
  name: 'my-project',
  type: 'folder',
  children: [
    {
      name: 'src',
      type: 'folder',
      children: [
        { name: 'main.py', type: 'file', language: 'python', content: `import asyncio
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello World"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
` },
        { name: 'utils.py', type: 'file', language: 'python', content: `def chunk_text(text: str, size: int = 500) -> list[str]:
    """Split text into chunks of given size."""
    return [text[i:i+size] for i in range(0, len(text), size)]

def flatten(lst: list) -> list:
    """Flatten a nested list."""
    result = []
    for item in lst:
        if isinstance(item, list):
            result.extend(flatten(item))
        else:
            result.append(item)
    return result
` },
        {
          name: 'components',
          type: 'folder',
          children: [
            { name: 'Button.jsx', type: 'file', language: 'javascript', content: `import React from 'react';

const Button = ({ children, onClick, variant = 'primary', disabled = false }) => {
  const base = 'px-4 py-2 rounded font-medium transition-all';
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-gray-100',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={\`\${base} \${variants[variant]} \${disabled ? 'opacity-50 cursor-not-allowed' : ''}\`}
    >
      {children}
    </button>
  );
};

export default Button;
` },
          ]
        },
      ]
    },
    { name: 'README.md', type: 'file', language: 'markdown', content: `# My Project\n\nA production-grade application built with FastAPI and React.\n\n## Setup\n\n\`\`\`bash\npip install -r requirements.txt\nuvicorn main:app --reload\n\`\`\`\n` },
    { name: 'requirements.txt', type: 'file', language: 'plaintext', content: `fastapi==0.111.0\nuvicorn[standard]==0.30.1\npython-dotenv==1.0.1\nhttpx==0.27.0\n` },
    { name: '.env', type: 'file', language: 'plaintext', content: `API_KEY=your_key_here\nDEBUG=true\n` },
  ]
}

const LANGUAGE_COLORS = {
  python: '#3572A5',
  javascript: '#f1e05a',
  typescript: '#2b7489',
  markdown: '#083fa1',
  plaintext: '#555',
  default: '#6e7681',
}

const getFileColor = (name) => {
  if (name.endsWith('.py')) return LANGUAGE_COLORS.python
  if (name.endsWith('.js') || name.endsWith('.jsx')) return LANGUAGE_COLORS.javascript
  if (name.endsWith('.ts') || name.endsWith('.tsx')) return LANGUAGE_COLORS.typescript
  if (name.endsWith('.md')) return LANGUAGE_COLORS.markdown
  return LANGUAGE_COLORS.default
}

function TreeNode({ node, depth = 0, onFileSelect, selectedFile }) {
  const [open, setOpen] = useState(depth < 1)
  const isSelected = node.type === 'file' && selectedFile?.name === node.name

  if (node.type === 'folder') {
    return (
      <div>
        <div
          className="tree-item folder"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => setOpen(!open)}
        >
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {open ? <FolderOpen size={14} className="folder-icon" /> : <Folder size={14} className="folder-icon" />}
          <span>{node.name}</span>
        </div>
        {open && node.children?.map((child, i) => (
          <TreeNode
            key={i}
            node={child}
            depth={depth + 1}
            onFileSelect={onFileSelect}
            selectedFile={selectedFile}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={`tree-item file ${isSelected ? 'selected' : ''}`}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
      onClick={() => onFileSelect(node)}
    >
      <span className="file-dot" style={{ background: getFileColor(node.name) }} />
      <File size={13} style={{ opacity: 0.5, flexShrink: 0 }} />
      <span>{node.name}</span>
    </div>
  )
}

export default function FileExplorer({ onFileSelect, selectedFile }) {
  return (
    <div className="file-explorer">
      <div className="panel-header">
        <span>EXPLORER</span>
        <div className="header-actions">
          <button className="icon-btn" title="New file"><Plus size={13} /></button>
          <button className="icon-btn" title="Refresh"><RefreshCw size={13} /></button>
        </div>
      </div>
      <div className="explorer-tree">
        <div className="workspace-label">
          <Folder size={12} />
          <span>{MOCK_WORKSPACE.name}</span>
        </div>
        {MOCK_WORKSPACE.children.map((node, i) => (
          <TreeNode
            key={i}
            node={node}
            depth={0}
            onFileSelect={onFileSelect}
            selectedFile={selectedFile}
          />
        ))}
      </div>
    </div>
  )
}
