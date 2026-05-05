from services.tavily_client import tavily_search
from services.groq_client import groq_chat_completion

SYSTEM_PROMPT = """You are a Research Agent. You synthesize web search results to answer
coding and technical questions accurately. Be concise, cite sources where relevant,
and focus on practical, actionable answers."""


async def research(query: str) -> dict:
    """Search the web and synthesize results into a helpful answer."""
    raw = await tavily_search(query, max_results=5)

    results = raw.get("results", [])
    tavily_answer = raw.get("answer", "")

    # Build context from search results
    snippets = []
    sources = []
    for r in results:
        snippets.append(f"Source: {r.get('url', '')}\n{r.get('content', '')[:600]}")
        sources.append({"title": r.get("title", ""), "url": r.get("url", "")})

    context = "\n\n---\n\n".join(snippets)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Query: {query}\n\n"
                f"Tavily answer: {tavily_answer}\n\n"
                f"Search results:\n{context}\n\n"
                "Provide a synthesized, helpful answer."
            ),
        },
    ]

    answer = await groq_chat_completion(messages, temperature=0.3)
    return {"answer": answer, "sources": sources}
