import ollama
import os
from typing import List, Dict, Any

# Ollama configuration
OLLAMA_HOST = os.getenv('OLLAMA_HOST', 'http://localhost:11434')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3.1')

# Initialize Ollama client
try:
    ollama.Client(host=OLLAMA_HOST)
    client = ollama  # For backward compatibility
    print(f"[OLLAMA] Connected to Ollama at {OLLAMA_HOST}")
except Exception as e:
    print(f"[OLLAMA ERROR] Failed to connect to Ollama: {e}")
    client = None

def generate_response(prompt, context_chunks):
    """
    Generate a response using Ollama with the provided context chunks.
    
    Args:
        prompt: The user's question
        context_chunks: List of (chunk_text, source) tuples
    
    Returns:
        dict: Contains 'answer' and 'used_chunks' (indices of chunks actually used)
    """
    # Format context with chunk indices for tracking
    formatted_chunks = []
    for i, (chunk, source) in enumerate(context_chunks):
        formatted_chunks.append(f"[CHUNK_{i}] Source: {source}\n{chunk}\n")
    
    context = "\n".join(formatted_chunks)
    
    system_prompt = (
        "You are an AI assistant helping with document analysis.\n"
        "Answer the user's question using only the context provided. Do not hallucinate. Always cite the source for each fact using the provided format.\n\n"
        "IMPORTANT GUIDELINES:\n"
        "1. If the context contains enough information, provide a clear, accurate, and concise answer.\n"
        "2. If the context is partially relevant but incomplete, provide what information you can and clearly state what's missing.\n"
        "3. If the context is not relevant at all, acknowledge this and suggest what kind of information would be needed.\n"
        "4. Always be honest about limitations - don't make up information.\n\n"
        "Format the answer like this:\n"
        "- Provide a clear, concise answer based on available information.\n"
        "- Include references like [<filename>.pdf - Page X] inline where relevant.\n"
        "- If information is missing, clearly state what's not available.\n"
        "- At the end, list the chunk numbers you used in your answer like: [USED_CHUNKS: 0,2,4]\n\n"
        "Your task is to carefully read the provided context and answer the user's question using only the information available in the context.\n"
        "If the context contains information from different documents, mention any ambiguity and provide the available information.\n"
        "Respond directly without repeating the question or adding unnecessary explanations. Give just the answer and nothing else."
    )

    user_message = f"Context:\n{context}\n\nUser Question:\n{prompt}"

    try:
        response = ollama.chat(
            model=OLLAMA_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            stream=False
        )

        content = response.get('message', {}).get('content', '')
        if not content:
            return {
                "answer": "Unable to generate response.",
                "used_chunks": []
            }
        
        answer = content
        
        # Extract used chunk indices from the answer
        used_chunks = []
        if "[USED_CHUNKS:" in answer:
            try:
                # Extract the used chunks section
                used_chunks_section = answer.split("[USED_CHUNKS:")[1].split("]")[0]
                # Parse the chunk numbers
                used_chunks = [int(x.strip()) for x in used_chunks_section.split(",") if x.strip().isdigit()]
                # Remove the used chunks section from the answer
                answer = answer.split("[USED_CHUNKS:")[0].strip()
            except:
                # If parsing fails, assume all chunks were used
                used_chunks = list(range(len(context_chunks)))
        else:
            # If no used chunks specified, assume all chunks were used
            used_chunks = list(range(len(context_chunks)))
        
        return {
            "answer": answer,
            "used_chunks": used_chunks
        }

    except Exception as e:
        print(f"[OLLAMA ERROR] Failed to generate response: {e}")
        return {
            "answer": f"Sorry, I encountered an error while generating the response: {str(e)}",
            "used_chunks": []
        }
