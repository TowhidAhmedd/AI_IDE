import os
from pathlib import Path

SUPPORTED_EXTENSIONS = {
    ".py", ".js", ".ts", ".jsx", ".tsx", ".html", ".css", ".json",
    ".md", ".txt", ".yaml", ".yml", ".toml", ".sh", ".rs", ".go",
    ".java", ".cpp", ".c", ".h", ".rb", ".php", ".swift", ".kt",
}

MAX_FILE_SIZE_BYTES = 1_000_000  # 1 MB


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """Split text into overlapping chunks by lines."""
    lines = text.splitlines(keepends=True)
    chunks = []
    current_chunk: list[str] = []
    current_len = 0

    for line in lines:
        current_chunk.append(line)
        current_len += len(line)
        if current_len >= chunk_size:
            chunks.append("".join(current_chunk))
            # Keep overlap lines
            overlap_lines = current_chunk[-max(1, overlap // 80):]
            current_chunk = overlap_lines
            current_len = sum(len(l) for l in current_chunk)

    if current_chunk:
        chunks.append("".join(current_chunk))

    return [c for c in chunks if c.strip()]


def load_file(path: str) -> str | None:
    p = Path(path)
    if not p.exists() or not p.is_file():
        return None
    if p.suffix not in SUPPORTED_EXTENSIONS:
        return None
    if p.stat().st_size > MAX_FILE_SIZE_BYTES:
        return None
    try:
        return p.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return None


def load_workspace(workspace_path: str) -> dict[str, str]:
    """Walk workspace directory and return {relative_path: content}."""
    result = {}
    base = Path(workspace_path)
    if not base.exists():
        return result
    for root, dirs, files in os.walk(base):
        # Skip hidden and common non-code dirs
        dirs[:] = [d for d in dirs if not d.startswith(".") and d not in {"node_modules", "__pycache__", ".git", "dist", "build", ".venv", "venv"}]
        for fname in files:
            fpath = Path(root) / fname
            if fpath.suffix in SUPPORTED_EXTENSIONS:
                content = load_file(str(fpath))
                if content:
                    rel = str(fpath.relative_to(base))
                    result[rel] = content
    return result
