import ollama

def embed_chunks(chunk):
    """
    Embeds the input text chunk using Ollama's embedding model.
    Returns a vector representation of the text.
    """
    response = ollama.embeddings(model="llama2", prompt=chunk)
    return response["embedding"]

def embed_query(text):
    """
    Embeds the input query using Ollama's embedding model.
    Returns a vector representation of the text.
    """
    response = ollama.embeddings(model="llama2", prompt=text)
    return response["embedding"]
