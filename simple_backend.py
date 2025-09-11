from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import ollama
from qdrant_client import QdrantClient
from qdrant_client.http import models
import PyPDF2
import io
import uuid

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3.1')
QDRANT_HOST = os.getenv('QDRANT_HOST', 'http://localhost:6333')

# Initialize Qdrant client
qdrant_client = QdrantClient(url=QDRANT_HOST)
COLLECTION_NAME = "simple_docs"

# Create collection if it doesn't exist
try:
    collections = qdrant_client.get_collections().collections
    if COLLECTION_NAME not in [c.name for c in collections]:
        qdrant_client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=models.VectorParams(size=4096, distance=models.Distance.COSINE)
        )
        print(f"Created collection: {COLLECTION_NAME}")
    else:
        print(f"Collection {COLLECTION_NAME} already exists")
except Exception as e:
    print(f"Error with Qdrant: {e}")

def extract_text_from_pdf(file_content):
    """Extract text from PDF file content"""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"Error extracting PDF: {e}")
        return ""

def chunk_text(text, chunk_size=1000):
    """Split text into chunks"""
    words = text.split()
    chunks = []
    current_chunk = []
    current_size = 0
    
    for word in words:
        current_chunk.append(word)
        current_size += len(word) + 1
        
        if current_size >= chunk_size:
            chunks.append(" ".join(current_chunk))
            current_chunk = []
            current_size = 0
    
    if current_chunk:
        chunks.append(" ".join(current_chunk))
    
    return chunks

@app.route("/upload", methods=["POST"])
def upload_document():
    """Upload and process a document"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Extract text based on file type
        if file.filename.lower().endswith('.pdf'):
            text = extract_text_from_pdf(file.read())
        elif file.filename.lower().endswith('.txt'):
            text = file.read().decode('utf-8')
        else:
            return jsonify({"error": "Unsupported file type. Use PDF or TXT"}), 400
        
        if not text.strip():
            return jsonify({"error": "No text found in file"}), 400
        
        # Split into chunks (limit to max 100)
        chunks = chunk_text(text)
        max_chunks = 100
        if len(chunks) > max_chunks:
            print(f"[UPLOAD] Limiting to first {max_chunks} chunks out of {len(chunks)}")
            chunks = chunks[:max_chunks]
        print(f"Created {len(chunks)} chunks from {file.filename}")

        # Generate embeddings and store in Qdrant
        points = []
        failed_chunks = 0
        for i, chunk in enumerate(chunks):
            try:
                print(f"[UPLOAD] Processing chunk {i+1}/{len(chunks)}")
                embedding_response = ollama.embeddings(
                    model=OLLAMA_MODEL,
                    prompt=chunk
                )
                embedding = embedding_response["embedding"]
                point_id = str(uuid.uuid4())
                points.append(
                    models.PointStruct(
                        id=point_id,
                        vector=embedding,
                        payload={
                            "text": chunk,
                            "source": file.filename,
                            "chunk_id": i
                        }
                    )
                )
            except Exception as chunk_error:
                print(f"[UPLOAD] Error processing chunk {i}: {chunk_error}")
                failed_chunks += 1

        if points:
            qdrant_client.upsert(collection_name=COLLECTION_NAME, points=points)
        else:
            print("[UPLOAD] No valid chunks to upload!")

        msg = f"Successfully processed {file.filename}" if points else f"No valid chunks processed for {file.filename}"
        result = {
            "success": bool(points),
            "message": msg,
            "chunks_created": len(points),
            "chunks_failed": failed_chunks
        }
        if failed_chunks:
            result["warning"] = f"{failed_chunks} chunks failed to process. See logs for details."
        return jsonify(result)
        
    except Exception as e:
        print(f"Upload error: {e}")
        return jsonify({"error": f"Failed to process file: {str(e)}"}), 500

@app.route("/chat", methods=["POST"])
def chat():
    """Answer questions based on uploaded documents"""
    try:
        data = request.json
        query = data.get("query")
        
        if not query:
            return jsonify({"error": "No query provided"}), 400
        
        print(f"Processing query: {query}")
        
        # Generate embedding for query
        embedding_response = ollama.embeddings(
            model=OLLAMA_MODEL,
            prompt=query
        )
        query_embedding = embedding_response["embedding"]
        
        # Search for relevant chunks
        search_results = qdrant_client.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_embedding,
            limit=3,
            with_payload=True
        )
        
        if not search_results:
            return jsonify({
                "answer": "I couldn't find any relevant information in the uploaded documents to answer your question.",
                "sources": []
            })
        
        # Prepare context from search results
        context_parts = []
        sources = []
        
        for hit in search_results:
            text = hit.payload.get("text", "")
            source = hit.payload.get("source", "Unknown")
            score = hit.score
            
            context_parts.append(f"Source: {source}\n{text}")
            sources.append({
                "source": source,
                "score": round(score, 3),
                "snippet": text[:200] + "..." if len(text) > 200 else text
            })
        
        context = "\n\n---\n\n".join(context_parts)
        
        # Generate answer using LLM
        prompt = f"""Based on the following context, answer the user's question. If the context doesn't contain enough information, say so clearly.

Context:
{context}

Question: {query}

Answer:"""

        response = ollama.chat(
            model=OLLAMA_MODEL,
            messages=[
                {"role": "user", "content": prompt}
            ],
            stream=False
        )
        
        answer = response.get('message', {}).get('content', 'No response generated')
        
        return jsonify({
            "answer": answer,
            "sources": sources,
            "context_found": len(search_results)
        })
        
    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({"error": f"Failed to process query: {str(e)}"}), 500

@app.route("/status", methods=["GET"])
def status():
    """Check system status"""
    try:
        # Check Qdrant
        collections = qdrant_client.get_collections()
        collection_info = qdrant_client.get_collection(COLLECTION_NAME)
        
        # Check Ollama
        ollama_models = ollama.list()
        
        return jsonify({
            "status": "healthy",
            "qdrant_collections": len(collections.collections),
            "documents_count": collection_info.points_count,
            "ollama_models": len(ollama_models.get('models', [])),
            "current_model": OLLAMA_MODEL
        })
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500

@app.route("/clear", methods=["POST"])
def clear_documents():
    """Clear all documents from the collection"""
    try:
        # Delete and recreate collection
        qdrant_client.delete_collection(COLLECTION_NAME)
        qdrant_client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=models.VectorParams(size=4096, distance=models.Distance.COSINE)
        )
        
        return jsonify({"success": True, "message": "All documents cleared"})
        
    except Exception as e:
        return jsonify({"error": f"Failed to clear documents: {str(e)}"}), 500

if __name__ == "__main__":
    print("🚀 Starting Simple RAG Backend...")
    print(f"📚 Collection: {COLLECTION_NAME}")
    print(f"🤖 Model: {OLLAMA_MODEL}")
    print(f"🔍 Qdrant: {QDRANT_HOST}")
    app.run(host="0.0.0.0", port=5000, debug=True)
