from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.groq_client import groq_stream_completion
from rag.vector_store import get_vector_store
import json

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    current_file: str = ""
    current_code: str = ""
    history: list[dict] = []


SYSTEM_PROMPT = """You are an expert AI coding assistant integrated into an IDE (like Cursor).
You have access to the user's current file and relevant code context.
- Answer concisely but thoroughly.
- When writing code, use markdown code blocks with language tags.
- Reference the current file context when relevant.
- Be direct and practical."""


@router.post("/chat")
async def chat(req: ChatRequest):
    store = get_vector_store()

    # RAG: retrieve relevant context
    rag_context = ""
    if req.message and store:
        results = store.search(req.message, top_k=3)
        if results:
            snippets = []
            for doc, score in results:
                if score > 0.3:
                    fname = doc.metadata.get("filename", "unknown")
                    snippets.append(f"[{fname}]\n{doc.content[:400]}")
            if snippets:
                rag_context = "\n\n".join(snippets)

    # Build system message with context
    system_parts = [SYSTEM_PROMPT]
    if req.current_file:
        system_parts.append(f"\nCurrent file: {req.current_file}")
    if req.current_code:
        system_parts.append(f"\nCurrent file content:\n```\n{req.current_code[:3000]}\n```")
    if rag_context:
        system_parts.append(f"\nRelevant project context:\n{rag_context}")

    system_message = {"role": "system", "content": "\n".join(system_parts)}

    # Build messages array
    messages = [system_message]
    for h in req.history[-10:]:  # Keep last 10 turns
        messages.append(h)
    messages.append({"role": "user", "content": req.message})

    async def stream_generator():
        async for chunk in groq_stream_completion(messages, temperature=0.3):
            yield f"data: {json.dumps({'content': chunk})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        stream_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
