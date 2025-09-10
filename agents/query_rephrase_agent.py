# agents/query_rephrase_agent.py
import ollama
import os

OLLAMA_HOST = os.getenv('OLLAMA_HOST', 'http://localhost:11434')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3.1')

class QueryRephraseAgent:
    def rephrase(self, query: str, context_hint: str = "") -> str:
        prompt = f"""
        You are a helpful assistant. A user asked the following unclear question.
        Rephrase it into a more specific and detailed query.

        Original Question: {query}

        Context Hint: {context_hint}

        Rephrased Question:
        """

        response = ollama.chat(
            model=OLLAMA_MODEL,
            messages=[
                {"role": "system", "content": "You are a query refinement assistant."},
                {"role": "user", "content": prompt.strip()}
            ],
            options={
                "temperature": 0.3,
                "num_ctx": 4096
            }
        )

        return response.get('message', {}).get('content', '').strip()
