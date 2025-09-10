# agents/query_splitter_agent.py
import json
import ollama
import os

OLLAMA_HOST = os.getenv('OLLAMA_HOST', 'http://localhost:11434')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3.1')

class QuerySplitterAgent:
    def split(self, query: str) -> list[str]:
        system_prompt = (
            "You are a helpful assistant that breaks down complex or multi-entity questions "
            "into multiple simple sub-questions. If a query contains multiple parts joined by 'and', 'or', or commas, "
            "split them appropriately. Return the result as a JSON list of strings only.\n\n"
            "Examples:\n"
            "Query: What are the financials of Apple and Microsoft?\n"
            "Output: [\"What are the financials of Apple?\", \"What are the financials of Microsoft?\"]\n\n"
            "Query: What is the mission and vision of Tesla?\n"
            "Output: [\"What is the mission of Tesla?\", \"What is the vision of Tesla?\"]"
        )

        user_prompt = f"Split the following query into simpler sub-questions:\n\n{query}\n\nReturn only a JSON list."

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

        raw = response.get('message', {}).get('content', '')
        try:
            sub_questions = json.loads(raw)
            assert isinstance(sub_questions, list)
            return sub_questions
        except:
            return [query]  # fallback if parsing fails
