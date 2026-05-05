from services.groq_client import groq_chat_completion, groq_stream_completion

SYSTEM_PROMPT = """You are an expert Debugger Agent. Your job is to:
1. Analyze code and error messages.
2. Identify the root cause of bugs.
3. Provide a fixed version of the code.
4. Briefly explain what was wrong and how you fixed it.
Always output the fixed code in a markdown code block."""


async def debug_code(code: str, error: str = "", context: str = "") -> str:
    parts = [f"Code:\n```\n{code}\n```"]
    if error:
        parts.append(f"Error:\n{error}")
    if context:
        parts.append(f"Additional context:\n{context}")

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": "\n\n".join(parts)},
    ]
    return await groq_chat_completion(messages, temperature=0.1)


async def debug_code_stream(code: str, error: str = "", context: str = ""):
    parts = [f"Code:\n```\n{code}\n```"]
    if error:
        parts.append(f"Error:\n{error}")
    if context:
        parts.append(f"Additional context:\n{context}")

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": "\n\n".join(parts)},
    ]
    async for chunk in groq_stream_completion(messages, temperature=0.1):
        yield chunk
