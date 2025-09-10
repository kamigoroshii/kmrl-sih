# agents/context_analyst_agent.py
import ollama
import json
import os

OLLAMA_HOST = os.getenv('OLLAMA_HOST', 'http://localhost:11434')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3.1')

class ContextAnalystAgent:
    def rewrite(self, sub_question: str, context: str) -> str:
        system_prompt = (
            "You are a helpful assistant that improves the clarity of sub-questions.\n"
            "Given a sub-question and the original user query as context, rewrite the sub-question to be clearer and more self-contained.\n"
            "Return only the rewritten question as plain text."
        )

        user_prompt = (
            f"Original user query:\n{context}\n\n"
            f"Sub-question to rewrite:\n{sub_question}\n\n"
            f"Rewrite the sub-question clearly. Don't include any explanation."
        )

        response = ollama.chat(
            model=OLLAMA_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            options={
                "temperature": 0.3,
                "num_ctx": 4096
            }
        )

        return response.get('message', {}).get('content', '').strip()
