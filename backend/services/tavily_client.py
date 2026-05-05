import os
import httpx
from dotenv import load_dotenv

load_dotenv()

TAVILY_BASE_URL = "https://api.tavily.com"


async def tavily_search(query: str, max_results: int = 5) -> dict:
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        raise EnvironmentError("TAVILY_API_KEY not set in environment")

    payload = {
        "api_key": api_key,
        "query": query,
        "max_results": max_results,
        "search_depth": "advanced",
        "include_answer": True,
        "include_raw_content": False,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(f"{TAVILY_BASE_URL}/search", json=payload)
        response.raise_for_status()
        return response.json()
