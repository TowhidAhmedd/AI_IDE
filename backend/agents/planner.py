from services.groq_client import groq_chat_completion

SYSTEM_PROMPT = """You are a Planner Agent in a multi-agent AI coding system.
Your role is to decompose a user's coding task into clear, ordered sub-tasks.
Output a numbered list of concrete steps. Be concise and technical.
Each step should be actionable by a Coder or Debugger agent.
Do not write code — only plan."""


async def plan_task(task: str, context: str = "") -> str:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"Task: {task}\n\nContext:\n{context}" if context else f"Task: {task}",
        },
    ]
    return await groq_chat_completion(messages, temperature=0.2)
