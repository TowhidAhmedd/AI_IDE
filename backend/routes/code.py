from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from agents.coder import generate_code_stream, refactor_code_stream, explain_code_stream
from agents.debugger import debug_code_stream
from agents.researcher import research
from agents.planner import plan_task
from rag.vector_store import get_vector_store, Document
from utils.file_loader import chunk_text
import json

router = APIRouter()


# ─── Request Models ──────────────────────────────────────────────────────────

class GenerateCodeRequest(BaseModel):
    task: str
    language: str = ""
    current_file: str = ""
    current_code: str = ""


class DebugRequest(BaseModel):
    code: str
    error: str = ""
    current_file: str = ""


class RefactorRequest(BaseModel):
    code: str
    instructions: str = ""


class ExplainRequest(BaseModel):
    code: str


class SearchWebRequest(BaseModel):
    query: str


class IndexFileRequest(BaseModel):
    filename: str
    content: str


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _sse_stream(async_gen):
    async def generator():
        async for chunk in async_gen:
            yield f"data: {json.dumps({'content': chunk})}\n\n"
        yield "data: [DONE]\n\n"
    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


def _get_rag_context(query: str) -> str:
    store = get_vector_store()
    results = store.search(query, top_k=3)
    snippets = []
    for doc, score in results:
        if score > 0.25:
            fname = doc.metadata.get("filename", "unknown")
            snippets.append(f"[{fname}]\n{doc.content[:400]}")
    return "\n\n".join(snippets)


# ─── Routes ──────────────────────────────────────────────────────────────────

@router.post("/generate-code")
async def generate_code_endpoint(req: GenerateCodeRequest):
    context_parts = []
    if req.current_code:
        context_parts.append(f"Current file ({req.current_file}):\n{req.current_code[:2000]}")
    rag_ctx = _get_rag_context(req.task)
    if rag_ctx:
        context_parts.append(f"Relevant project context:\n{rag_ctx}")
    context = "\n\n".join(context_parts)

    return _sse_stream(generate_code_stream(req.task, context, req.language))


@router.post("/debug")
async def debug_endpoint(req: DebugRequest):
    context = _get_rag_context(req.error or req.code[:200])
    return _sse_stream(debug_code_stream(req.code, req.error, context))


@router.post("/refactor")
async def refactor_endpoint(req: RefactorRequest):
    return _sse_stream(refactor_code_stream(req.code, req.instructions))


@router.post("/explain")
async def explain_endpoint(req: ExplainRequest):
    return _sse_stream(explain_code_stream(req.code))


@router.post("/search-web")
async def search_web(req: SearchWebRequest):
    result = await research(req.query)
    return result


@router.post("/plan")
async def plan_endpoint(req: GenerateCodeRequest):
    context = _get_rag_context(req.task)
    plan = await plan_task(req.task, context)
    return {"plan": plan}


@router.post("/index-file")
async def index_file(req: IndexFileRequest):
    """Index a file into the vector store for RAG."""
    store = get_vector_store()
    chunks = chunk_text(req.content, chunk_size=600, overlap=80)
    docs = [
        Document(content=chunk, metadata={"filename": req.filename})
        for chunk in chunks
    ]
    store.add_documents(docs)
    return {"indexed": len(docs), "filename": req.filename}


@router.get("/index-stats")
async def index_stats():
    store = get_vector_store()
    return {"total_chunks": len(store)}


@router.delete("/index-clear")
async def clear_index():
    store = get_vector_store()
    store.clear()
    return {"message": "Vector store cleared"}
