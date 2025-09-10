# agents/query_analyzer_agent.py
import ollama
import os

OLLAMA_HOST = os.getenv('OLLAMA_HOST', 'http://localhost:11434')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3.1')

class QueryAnalyzerAgent:
    def is_query_clear(self, query: str) -> bool:
        prompt = f"""
        You are a query classification assistant. Determine if the following user query is **clear and specific** or **vague and ambiguous**.

        Query: "{query}"

        Respond with only one word: "CLEAR" or "VAGUE".
        """

        response = ollama.chat(
            model=OLLAMA_MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful assistant that classifies query clarity."},
                {"role": "user", "content": prompt.strip()}
            ],
            options={
                "temperature": 0,
                "num_ctx": 4096
            }
        )

        reply = response.get('message', {}).get('content', '').strip().upper()
        return "CLEAR" in reply
