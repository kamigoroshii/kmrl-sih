"""
Base configuration for all agents using Ollama instead of OpenAI
"""
import ollama
import os

# Ollama configuration
OLLAMA_HOST = os.getenv('OLLAMA_HOST', 'http://localhost:11434')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3.1')
OLLAMA_VISION_MODEL = os.getenv('OLLAMA_VISION_MODEL', 'llava')

def chat_with_ollama(messages, model=None, temperature=0.7, max_tokens=None):
    """
    Standard function to chat with Ollama models
    """
    try:
        response = ollama.chat(
            model=model or OLLAMA_MODEL,
            messages=messages,
            options={
                'temperature': temperature,
                'num_ctx': 4096
            }
        )
        return response.get('message', {}).get('content', '')
    except Exception as e:
        print(f"Error calling Ollama: {e}")
        return f"Error: {str(e)}"
