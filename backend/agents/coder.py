from services.groq_client import groq_chat_completion, groq_stream_completion

SYSTEM_PROMPT = """You are an expert Coder Agent. You write clean, production-grade code.
When given a task and optional context, return only the code implementation.
- Use best practices for the language/framework detected.
- Include docstrings / comments for complex logic.
- Do NOT include explanations outside code unless asked.
- Wrap code in appropriate markdown code blocks with the language tag."""


async def generate_code(task: str, context: str = "", language: str = "") -> str:
    lang_hint = f" in {language}" if language else ""
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Write code{lang_hint} for the following task:\n{task}"
                + (f"\n\nRelevant context:\n{context}" if context else "")
            ),
        },
    ]
    return await groq_chat_completion(messages, temperature=0.2)


async def generate_code_stream(task: str, context: str = "", language: str = ""):
    lang_hint = f" in {language}" if language else ""
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Write code{lang_hint} for the following task:\n{task}"
                + (f"\n\nRelevant context:\n{context}" if context else "")
            ),
        },
    ]
    async for chunk in groq_stream_completion(messages, temperature=0.2):
        yield chunk


async def refactor_code(code: str, instructions: str = "") -> str:
    hint = instructions or "Improve readability, performance, and maintainability."
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"Refactor the following code. Instructions: {hint}\n\n```\n{code}\n```",
        },
    ]
    return await groq_chat_completion(messages, temperature=0.2)


async def refactor_code_stream(code: str, instructions: str = ""):
    hint = instructions or "Improve readability, performance, and maintainability."
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"Refactor the following code. Instructions: {hint}\n\n```\n{code}\n```",
        },
    ]
    async for chunk in groq_stream_completion(messages, temperature=0.2):
        yield chunk


async def explain_code(code: str) -> str:
    messages = [
        {"role": "system", "content": "You are a helpful code explainer. Be clear and concise."},
        {
            "role": "user",
            "content": f"Explain this code step-by-step:\n\n```\n{code}\n```",
        },
    ]
    return await groq_chat_completion(messages, temperature=0.3)


async def explain_code_stream(code: str):
    messages = [
        {"role": "system", "content": "You are a helpful code explainer. Be clear and concise."},
        {"role": "user", "content": f"Explain this code step-by-step:\n\n```\n{code}\n```"},
    ]
    async for chunk in groq_stream_completion(messages, temperature=0.3):
        yield chunk
