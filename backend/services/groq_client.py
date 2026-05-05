import os
from groq import AsyncGroq
from dotenv import load_dotenv

load_dotenv()

_client: AsyncGroq | None = None


def get_groq_client() -> AsyncGroq:
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise EnvironmentError("GROQ_API_KEY not set in environment")
        _client = AsyncGroq(api_key=api_key)
    return _client


async def groq_chat_completion(messages: list[dict], model: str = "llama-3.3-70b-versatile", temperature: float = 0.3) -> str:
    client = get_groq_client()
    response = await client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=4096,
    )
    return response.choices[0].message.content


async def groq_stream_completion(messages: list[dict], model: str = "llama-3.3-70b-versatile", temperature: float = 0.3):
    client = get_groq_client()
    stream = await client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=4096,
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta
        if delta and delta.content:
            yield delta.content
