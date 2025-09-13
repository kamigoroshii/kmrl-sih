"""
Enhanced Chat Backend for KMRL Document Analysis System
Integrates with the React chat interface to provide intelligent document Q&A
"""

import os
import sys
import uuid
import json
import time
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
from io import BytesIO

# Flask and web framework imports
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS, cross_origin
from flask_bcrypt import Bcrypt
from functools import wraps

# Document processing imports
import PyPDF2
import docx
import pandas as pd
from PIL import Image
import pytesseract

# AI and vector database imports
import google.generativeai as genai
from qdrant_client import QdrantClient
from qdrant_client.http import models
from sentence_transformers import SentenceTransformer

# MongoDB imports
try:
    from mongodb import mongo_client, users_collection, document_agent_chats_collection
    MONGODB_AVAILABLE = True
except ImportError:
    MONGODB_AVAILABLE = False
    print("Warning: MongoDB not available, using in-memory storage")

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
class Config:
    # Flask settings
    DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    
    # AI Models
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-1.5-flash')
    EMBEDDING_MODEL = os.getenv('EMBEDDING_MODEL', 'all-MiniLM-L6-v2')
    
    # Vector Database
    QDRANT_HOST = os.getenv('QDRANT_HOST', 'http://localhost:6333')
    COLLECTION_NAME = os.getenv('COLLECTION_NAME', 'kmrl_documents')
    
    # File processing
    MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB
    ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.txt', '.csv', '.xlsx'}
    CHUNK_SIZE = 1000
    CHUNK_OVERLAP = 200
    MAX_CHUNKS_PER_FILE = 200
    
    # Chat settings
    MAX_CONTEXT_CHUNKS = 5
    MAX_CHAT_HISTORY = 50

# Initialize Flask app
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = Config.MAX_FILE_SIZE

# Initialize extensions
bcrypt = Bcrypt(app)
CORS(app, origins=['http://localhost:3000', 'http://localhost:5173'], supports_credentials=True)

# Initialize AI models
try:
    embedding_model = SentenceTransformer(Config.EMBEDDING_MODEL)
    logger.info(f"Loaded embedding model: {Config.EMBEDDING_MODEL}")
except Exception as e:
    logger.error(f"Failed to load embedding model: {e}")
    embedding_model = None

# Initialize Gemini
try:
    if Config.GEMINI_API_KEY:
        genai.configure(api_key=Config.GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel(Config.GEMINI_MODEL)
        logger.info(f"Initialized Gemini model: {Config.GEMINI_MODEL}")
        GEMINI_AVAILABLE = True
    else:
        logger.warning("GEMINI_API_KEY not provided")
        GEMINI_AVAILABLE = False
        gemini_model = None
except Exception as e:
    logger.error(f"Failed to initialize Gemini: {e}")
    GEMINI_AVAILABLE = False
    gemini_model = None

# Initialize Qdrant client
try:
    qdrant_client = QdrantClient(url=Config.QDRANT_HOST)
    
    # Create collection if it doesn't exist
    collections = qdrant_client.get_collections().collections
    if Config.COLLECTION_NAME not in [c.name for c in collections]:
        qdrant_client.create_collection(
            collection_name=Config.COLLECTION_NAME,
            vectors_config=models.VectorParams(
                size=384,  # all-MiniLM-L6-v2 dimension
                distance=models.Distance.COSINE
            ),
            optimizers_config=models.OptimizersConfigDiff(indexing_threshold=0)
        )
        logger.info(f"Created Qdrant collection: {Config.COLLECTION_NAME}")
    else:
        logger.info(f"Using existing Qdrant collection: {Config.COLLECTION_NAME}")
    
    QDRANT_AVAILABLE = True
except Exception as e:
    logger.error(f"Failed to initialize Qdrant: {e}")
    QDRANT_AVAILABLE = False

# In-memory storage for when databases aren't available
if not MONGODB_AVAILABLE:
    users_db = {}
    chats_db = {}


# Document processing utilities
class DocumentProcessor:
    @staticmethod
    def extract_text_from_pdf(file_content: bytes) -> str:
        """Extract text from PDF file"""
        try:
            pdf_reader = PyPDF2.PdfReader(BytesIO(file_content))
            text = ""
            for page_num, page in enumerate(pdf_reader.pages, 1):
                page_text = page.extract_text()
                if page_text.strip():
                    text += f"\\n[Page {page_num}]\\n{page_text}\\n"
            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting PDF: {e}")
            return ""
    
    @staticmethod
    def extract_text_from_docx(file_content: bytes) -> str:
        """Extract text from DOCX file"""
        try:
            doc = docx.Document(BytesIO(file_content))
            text = ""
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    text += paragraph.text + "\\n"
            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting DOCX: {e}")
            return ""
    
    @staticmethod
    def extract_text_from_xlsx(file_content: bytes) -> str:
        """Extract text from Excel file"""
        try:
            df = pd.read_excel(BytesIO(file_content))
            # Convert DataFrame to text representation
            text = f"Table Data:\\n{df.to_string(index=False)}"
            return text
        except Exception as e:
            logger.error(f"Error extracting Excel: {e}")
            return ""
    
    @staticmethod
    def extract_text_from_csv(file_content: bytes) -> str:
        """Extract text from CSV file"""
        try:
            df = pd.read_csv(BytesIO(file_content))
            text = f"Table Data:\\n{df.to_string(index=False)}"
            return text
        except Exception as e:
            logger.error(f"Error extracting CSV: {e}")
            return ""
    
    @staticmethod
    def chunk_text(text: str, chunk_size: int = Config.CHUNK_SIZE, 
                   overlap: int = Config.CHUNK_OVERLAP) -> List[str]:
        """Split text into overlapping chunks"""
        if not text.strip():
            return []
        
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), chunk_size - overlap):
            chunk_words = words[i:i + chunk_size]
            chunk_text = " ".join(chunk_words)
            if chunk_text.strip():
                chunks.append(chunk_text)
            
            # Limit number of chunks per file
            if len(chunks) >= Config.MAX_CHUNKS_PER_FILE:
                break
        
        return chunks

# Vector database utilities
class VectorStore:
    @staticmethod
    def generate_embeddings(texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of texts"""
        if not embedding_model:
            raise Exception("Embedding model not available")
        
        try:
            embeddings = embedding_model.encode(texts, convert_to_tensor=False)
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            raise
    
    @staticmethod
    def store_document_chunks(chunks: List[str], metadata: Dict, filename: str) -> int:
        """Store document chunks in vector database"""
        if not QDRANT_AVAILABLE:
            raise Exception("Qdrant not available")
        
        try:
            # Generate embeddings
            embeddings = VectorStore.generate_embeddings(chunks)
            
            # Create points for Qdrant
            points = []
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                point_metadata = metadata.copy()
                point_metadata.update({
                    'text': chunk,
                    'chunk_index': i,
                    'total_chunks': len(chunks),
                    'filename': filename
                })
                
                points.append(models.PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding,
                    payload=point_metadata
                ))
            
            # Upload to Qdrant
            qdrant_client.upsert(collection_name=Config.COLLECTION_NAME, points=points)
            logger.info(f"Stored {len(points)} chunks for {filename}")
            
            return len(points)
            
        except Exception as e:
            logger.error(f"Error storing chunks: {e}")
            raise
    
    @staticmethod
    def search_similar_chunks(query: str, limit: int = Config.MAX_CONTEXT_CHUNKS) -> List[Dict]:
        """Search for similar chunks using vector similarity"""
        if not QDRANT_AVAILABLE or not embedding_model:
            return []
        
        try:
            # Generate query embedding
            query_embedding = embedding_model.encode([query])[0].tolist()
            
            # Search in Qdrant
            search_results = qdrant_client.search(
                collection_name=Config.COLLECTION_NAME,
                query_vector=query_embedding,
                limit=limit,
                with_payload=True
            )
            
            # Format results
            results = []
            for hit in search_results:
                results.append({
                    'text': hit.payload.get('text', ''),
                    'filename': hit.payload.get('filename', ''),
                    'chunk_index': hit.payload.get('chunk_index', 0),
                    'score': hit.score,
                    'metadata': hit.payload
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching chunks: {e}")
            return []

# Chat utilities
class ChatManager:
    @staticmethod
    def generate_response(query: str, context_chunks: List[Dict], language: str = 'english') -> str:
        """Generate response using Gemini AI"""
        try:
            if not GEMINI_AVAILABLE or not gemini_model:
                return "I apologize, but the AI service is currently unavailable. Please check the configuration and try again."
            
            # Build context from chunks
            context_parts = []
            for chunk in context_chunks:
                source_info = f"[Source: {chunk['filename']}, Chunk {chunk['chunk_index'] + 1}]"
                context_parts.append(f"{source_info}\\n{chunk['text']}")
            
            context = "\\n\\n---\\n\\n".join(context_parts)
            
            # Create prompt based on selected language
            if context.strip():
                if language == 'malayalam':
                    prompt = f"""Following KMRL documents context based on, user question answer accurately and comprehensively in Malayalam.

Context:
{context}

Question: {query}

Instructions:
- മലയാളത്തിൽ വിശദമായ ഉത്തരം നൽകുക
- സന്ദർഭത്തിൽ മതിയായ വിവരങ്ങൾ ഇല്ലെങ്കിൽ, എന്ത് വിവരങ്ങൾ കാണുന്നില്ല എന്ന് വ്യക്തമായി പറയുക
- സാധ്യമായിടത്ത് നിർദ്ദിഷ്ട സ്രോതസ്സുകൾ ഉദ്ധരിക്കുക
- കെഎംആർഎൽ-related വിവരങ്ങളിൽ ശ്രദ്ധ കേന്ദ്രീകരിക്കുക
- മാർക്ക്ഡൗൺ ഫോർമാറ്റിംഗ് ഉപയോഗിക്കുക:
  - **bold** ഉപയോഗിച്ച് പ്രധാന വിഷയങ്ങൾ ഹൈലൈറ്റ് ചെയ്യുക
  - പട്ടികയ്ക്ക് bullet points (-) ഉപയോഗിക്കുക
  - വിഭാഗങ്ങൾക്കിടയിൽ line breaks ഉപയോഗിക്കുക

മലയാളം ഉത്തരം:"""
                else:
                    prompt = f"""Based on the following context from KMRL documents, answer the user's question accurately and comprehensively in English.

Context:
{context}

Question: {query}

Instructions:
- Provide a detailed answer based on the context
- If the context doesn't contain enough information, clearly state what information is missing
- Cite specific sources when possible
- Be concise but thorough
- Focus on KMRL-related information
- Format your response using proper markdown with:
  - Use **bold** for section headings and important terms
  - Use bullet points (-) for lists
  - Use line breaks between sections for better readability
  - Use proper paragraph spacing

Answer:"""
            else:
                if language == 'malayalam':
                    prompt = f"""User asking: {query}

ഈ ചോദ്യത്തിന് ഉത്തരം നൽകാൻ എനിക്ക് പ്രസക്തമായ ഡോക്യുമെന്റ് സന്ദർഭം ഇല്ല. കെഎംആർഎൽ സംബന്ധിയായ വിഷയങ്ങളെക്കുറിച്ച് കൃത്യമായ ഉത്തരം നൽകാൻ ദയവായി നിർദ്ദിഷ്ട കെഎംആർഎൽ ഡോക്യുമെന്റുകൾ അപ്‌ലോഡ് ചെയ്യുക.

മലയാളം ഉത്തരം:"""
                else:
                    prompt = f"""The user is asking: {query}

I don't have any relevant document context to answer this question. Please upload specific KMRL documents to provide an accurate answer about KMRL-related topics.

Answer:"""
            
            # Generate response using Gemini
            response = gemini_model.generate_content(prompt)
            
            if response.text:
                return response.text.strip()
            else:
                return "I apologize, but I couldn't generate a response. Please try rephrasing your question."
            
        except Exception as e:
            logger.error(f"Error generating response with Gemini: {e}")
            return "I apologize, but I encountered an error while processing your question. Please try again later."
    
    @staticmethod
    def save_chat_message(user_id: str, chat_id: str, question: str, answer: str, sources: List[Dict]):
        """Save chat message to database"""
        chat_record = {
            'user_id': user_id,
            'chat_id': chat_id,
            'question': question,
            'answer': answer,
            'sources': sources,
            'timestamp': datetime.now(timezone.utc)
        }
        
        if MONGODB_AVAILABLE:
            document_agent_chats_collection.insert_one(chat_record)
        else:
            if chat_id not in chats_db:
                chats_db[chat_id] = []
            chats_db[chat_id].append(chat_record)

# API Routes

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'services': {
            'mongodb': MONGODB_AVAILABLE,
            'qdrant': QDRANT_AVAILABLE,
            'embedding_model': embedding_model is not None,
            'gemini': GEMINI_AVAILABLE,
            'gemini_model': Config.GEMINI_MODEL if GEMINI_AVAILABLE else None
        }
    })

@app.route('/api/upload', methods=['POST'])
def upload_document():
    """Upload and process document"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file type
        filename = file.filename.lower()
        file_ext = None
        for ext in Config.ALLOWED_EXTENSIONS:
            if filename.endswith(ext):
                file_ext = ext
                break
        
        if not file_ext:
            return jsonify({'error': f'Unsupported file type. Allowed: {Config.ALLOWED_EXTENSIONS}'}), 400
        
        # Read file content
        file_content = file.read()
        
        # Save original file for viewing
        upload_dir = os.path.join(os.getcwd(), 'uploads')
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, file.filename)
        
        with open(file_path, 'wb') as f:
            f.write(file_content)
        
        # Extract text based on file type
        if file_ext == '.pdf':
            text = DocumentProcessor.extract_text_from_pdf(file_content)
        elif file_ext == '.docx':
            text = DocumentProcessor.extract_text_from_docx(file_content)
        elif file_ext == '.txt':
            text = file_content.decode('utf-8')
        elif file_ext == '.xlsx':
            text = DocumentProcessor.extract_text_from_xlsx(file_content)
        elif file_ext == '.csv':
            text = DocumentProcessor.extract_text_from_csv(file_content)
        else:
            return jsonify({'error': 'Unsupported file type'}), 400
        
        if not text.strip():
            return jsonify({'error': 'No text found in file'}), 400
        
        # Chunk the text
        chunks = DocumentProcessor.chunk_text(text)
        
        if not chunks:
            return jsonify({'error': 'Failed to create text chunks'}), 400
        
        # Prepare metadata
        metadata = {
            'original_filename': file.filename,
            'file_type': file_ext,
            'uploaded_by': 'system',
            'upload_date': datetime.now(timezone.utc).isoformat(),
            'file_size': len(file_content),
            'total_text_length': len(text)
        }
        
        # Store in vector database
        chunks_stored = VectorStore.store_document_chunks(chunks, metadata, file.filename)
        
        return jsonify({
            'success': True,
            'filename': file.filename,
            'chunks_created': chunks_stored,
            'text_length': len(text)
        })
        
    except Exception as e:
        logger.error(f"Upload error: {e}")
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    """Process chat message and generate response"""
    try:
        data = request.json
        message = data.get('message', '').strip()
        context_type = data.get('contextType', 'department')
        context_name = data.get('contextName', '')
        chat_id = data.get('chat_id')
        language = data.get('language', 'english')  # Get language preference
        
        if not message:
            return jsonify({'error': 'No message provided'}), 400
        
        if not chat_id:
            chat_id = str(uuid.uuid4())
        
        # Search for relevant document chunks
        relevant_chunks = VectorStore.search_similar_chunks(message)
        
        # Generate response
        response = ChatManager.generate_response(message, relevant_chunks, language)
        
        # Format sources for frontend
        sources = []
        for chunk in relevant_chunks:
            source_info = {
                'id': f"source_{len(sources)}",
                'title': chunk['filename'],
                'snippet': chunk['text'][:200] + '...' if len(chunk['text']) > 200 else chunk['text'],
                'score': round(chunk['score'], 3),
                'chunk_index': chunk['chunk_index'],
                'filename': chunk['filename']
            }
            
            # Add page information if available
            if 'metadata' in chunk and chunk['metadata']:
                metadata = chunk['metadata']
                if 'page_number' in metadata:
                    source_info['page_number'] = metadata['page_number']
                    source_info['title'] = f"{chunk['filename']} - Page {metadata['page_number']}"
                if 'file_type' in metadata:
                    source_info['file_type'] = metadata['file_type']
            
            sources.append(source_info)
        
        # Save to chat history
        ChatManager.save_chat_message(
            user_id='system',
            chat_id=chat_id,
            question=message,
            answer=response,
            sources=sources
        )
        
        return jsonify({
            'response': response,
            'chat_id': chat_id,
            'sources': sources
        })
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return jsonify({'error': f'Chat processing failed: {str(e)}'}), 500

@app.route('/api/chat/history', methods=['GET'])
def get_chat_history():
    """Get chat history for user"""
    try:
        user_id = 'system'
        
        if MONGODB_AVAILABLE:
            chats = list(document_agent_chats_collection.find(
                {'user_id': user_id}
            ).sort('timestamp', -1))
        else:
            chats = []
            for chat_messages in chats_db.values():
                for msg in chat_messages:
                    if msg.get('user_id') == user_id:
                        chats.append(msg)
            chats.sort(key=lambda x: x.get('timestamp', datetime.min), reverse=True)
        
        # Group by chat_id
        chat_history = {}
        for chat in chats:
            chat_id = chat.get('chat_id', 'unknown')
            if chat_id not in chat_history:
                chat_history[chat_id] = []
            
            chat_history[chat_id].append({
                'question': chat.get('question', ''),
                'answer': chat.get('answer', ''),
                'sources': chat.get('sources', []),
                'timestamp': chat.get('timestamp', datetime.now()).isoformat()
            })
        
        return jsonify(chat_history)
        
    except Exception as e:
        logger.error(f"Chat history error: {e}")
        return jsonify({'error': 'Failed to retrieve chat history'}), 500

@app.route('/api/documents', methods=['GET'])
def list_documents():
    """List uploaded documents"""
    try:
        if not QDRANT_AVAILABLE:
            return jsonify({'documents': []})
        
        # Get collection info
        collection_info = qdrant_client.get_collection(Config.COLLECTION_NAME)
        
        # Search for documents (get a sample to show available docs)
        results = qdrant_client.scroll(
            collection_name=Config.COLLECTION_NAME,
            limit=100,
            with_payload=True
        )
        
        # Group by filename
        documents = {}
        for point in results[0]:
            filename = point.payload.get('original_filename', 'Unknown')
            if filename not in documents:
                documents[filename] = {
                    'filename': filename,
                    'file_type': point.payload.get('file_type', ''),
                    'upload_date': point.payload.get('upload_date', ''),
                    'uploaded_by': point.payload.get('uploaded_by', ''),
                    'chunks': 0
                }
            documents[filename]['chunks'] += 1
        
        return jsonify({
            'documents': list(documents.values()),
            'total_documents': len(documents),
            'total_chunks': collection_info.points_count
        })
        
    except Exception as e:
        logger.error(f"Document list error: {e}")
        return jsonify({'error': 'Failed to retrieve documents'}), 500

@app.route('/api/documents/clear', methods=['POST'])
def clear_documents():
    """Clear all documents (admin only)"""
    try:
        # For now, allow any authenticated user to clear
        # In production, add admin check
        
        if not QDRANT_AVAILABLE:
            return jsonify({'error': 'Vector database not available'}), 500
        
        # Delete and recreate collection
        qdrant_client.delete_collection(Config.COLLECTION_NAME)
        qdrant_client.create_collection(
            collection_name=Config.COLLECTION_NAME,
            vectors_config=models.VectorParams(
                size=384,
                distance=models.Distance.COSINE
            ),
            optimizers_config=models.OptimizersConfigDiff(indexing_threshold=0)
        )
        
        return jsonify({'success': True, 'message': 'All documents cleared'})
        
    except Exception as e:
        logger.error(f"Clear documents error: {e}")
        return jsonify({'error': 'Failed to clear documents'}), 500

@app.route('/api/documents/<path:filename>/view', methods=['GET'])
def view_document(filename):
    """Serve document for viewing"""
    try:
        upload_dir = os.path.join(os.getcwd(), 'uploads')
        file_path = os.path.join(upload_dir, filename)
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'Document not found'}), 404
            
        return send_from_directory(upload_dir, filename)
        
    except Exception as e:
        logger.error(f"Document view error: {e}")
        return jsonify({'error': 'Failed to retrieve document'}), 500

# Error handlers
@app.errorhandler(413)
def file_too_large(e):
    return jsonify({'error': 'File too large. Maximum size is 16MB'}), 413

@app.errorhandler(500)
def internal_error(e):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    logger.info("🚀 Starting KMRL Chat Backend...")
    logger.info(f"📚 Collection: {Config.COLLECTION_NAME}")
    logger.info(f"🤖 Gemini Model: {Config.GEMINI_MODEL}")
    logger.info(f"🔍 Embedding Model: {Config.EMBEDDING_MODEL}")
    logger.info(f"🗄️ Vector DB: {Config.QDRANT_HOST}")
    logger.info(f"🔒 MongoDB: {'Available' if MONGODB_AVAILABLE else 'Not Available'}")
    logger.info(f"✨ Gemini AI: {'Available' if GEMINI_AVAILABLE else 'Not Available'}")
    
    app.run(host='0.0.0.0', port=5001, debug=Config.DEBUG)