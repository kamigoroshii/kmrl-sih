import json
from flask import Flask, request, jsonify, send_from_directory, Response, stream_with_context
from flask_cors import CORS, cross_origin
import os
import pandas as pd
from io import BytesIO
from collections import defaultdict
from rag_toolkit import answer_query
from llm import generate_response, client
from flasgger import Swagger
import re
import base64
from PIL import Image
import tempfile
import shutil
import time

from mongodb import users_collection, document_agent_chats_collection as chats_collection
from mongodb import mongo_client
from flask_bcrypt import Bcrypt
import jwt
from datetime import datetime, timedelta,timezone
from functools import wraps
from bson import ObjectId


import uuid 
# from dotenv import load_dotenv
# load_dotenv()

# --- Add logging setup ---
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("rag_backend")

# Import the new suggestion agents
from agents.query_suggestion_agent import QuerySuggestionAgent
from agents.new_chat_suggestion_agent import NewChatSuggestionAgent
from agents.image_analysis_agent import ImageAnalysisAgent
from agents.conversation_context_agent import ConversationContextAgent

# Import ingestion modules
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), 'Ingestion'))

from tools.loader import load_pdf_with_metadata, load_docx, load_excel, load_csv, load_image, load_markdown_file, load_json
from tools.chunker import chunk_text_with_metadata
from tools.embedder import embed_chunks
from Ingestion.clip_embedder import embed_image_clip
from Ingestion.ingest_v2 import describe_image_with_ollama

from typing import cast


app = Flask(__name__)
bcrypt = Bcrypt(app)
# Enable CORS for React frontend on localhost:3000 (and optionally 5173 for Vite)
from flask_cors import CORS
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://localhost:5173"]}}, supports_credentials=True)

# MongoDB setup (users_collection, chats_collection imported from backend.mongodb)
# Initialize image_analysis_collection from mongodb
try:
    from mongodb import mongo_client
    image_analysis_collection = mongo_client[os.getenv("MONGODB_DB_NAME", "document_agent_db")]["image_analysis"]
except:
    # Fallback to in-memory collection if MongoDB fails
    class InMemoryCollection:
        def __init__(self):
            self.data = {}
            self._id_counter = 1
        
        def insert_one(self, document):
            document["_id"] = str(self._id_counter)
            self.data[self._id_counter] = document
            self._id_counter += 1
            return type('obj', (object,), {'inserted_id': document["_id"]})
        
        def find_one(self, query):
            for doc in self.data.values():
                match = all(doc.get(k) == v for k, v in query.items())
                if match:
                    return doc
            return None
        
        def find(self, query=None):
            if query is None:
                return list(self.data.values())
            results = []
            for doc in self.data.values():
                match = all(doc.get(k) == v for k, v in query.items())
                if match:
                    results.append(doc)
            return results
        
        def delete_one(self, query):
            for doc_id, doc in list(self.data.items()):
                match = all(doc.get(k) == v for k, v in query.items())
                if match:
                    del self.data[doc_id]
                    return type('obj', (object,), {'deleted_count': 1})
            return type('obj', (object,), {'deleted_count': 0})
        
        def sort(self, field, direction):
            return self
    
    image_analysis_collection = InMemoryCollection()

# Initialize agents
query_suggestion_agent = QuerySuggestionAgent()
new_chat_suggestion_agent = NewChatSuggestionAgent()
image_analysis_agent = ImageAnalysisAgent()
conversation_context_agent = ConversationContextAgent(mongo_client)

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev_secret_key_123")

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")  # Path of the file's Folder 
PROCESSED_FILE_PATH = os.path.join(os.getcwd(), "processed_queries.xlsx")


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token=None
        auth_header = request.headers.get('Authorization')
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(" ")[1]
        else:
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            user_id = data.get('user_id')

            logger.debug(f"[AUTH] Looking up user by string _id: {user_id}")
            user = users_collection.find_one({'_id': str(user_id)})

            # If not found, and user_id looks like an ObjectId, try ObjectId lookup and migrate
            if not user:
                try:
                    from bson import ObjectId
                    if ObjectId.is_valid(user_id):
                        obj_id = ObjectId(user_id)
                        logger.debug(f"[AUTH] Not found by string. Trying ObjectId: {obj_id}")
                        user_obj = users_collection.find_one({'_id': obj_id})
                        if user_obj:
                            # Copy user data, set _id to string
                            user_data = dict(user_obj)
                            user_data['_id'] = str(user_id)
                            users_collection.insert_one(user_data)
                            users_collection.delete_one({'_id': obj_id})
                            user = user_data
                            logger.debug(f"[AUTH] Migrated user to string _id: {user_id}")
                except Exception as e:
                    logger.error(f"[AUTH] ObjectId lookup and migration failed: {e}")

            if not user:
                logger.warning(f"[AUTH] No user found for ID: {user_id}")
                # Print all user IDs in the DB for debugging
                all_users = list(users_collection.find({}, {"_id": 1, "username": 1}))
                logger.warning("[AUTH] All user IDs in DB:")
                for u in all_users:
                    logger.warning(f"  _id: {u.get('_id')}, username: {u.get('username')}")
                # Fallback: try to find by username in token (for debugging)
                username = data.get('username')
                if username:
                    user = users_collection.find_one({'username': username})
                    if user:
                        logger.warning(f"[AUTH] Fallback: found user by username: {username}")
                        return f(user, *args, **kwargs)
                return jsonify({'message': 'User not found'}), 401

            logger.info(f"[AUTH] ✅ User found: {user.get('username', 'unknown')} (Admin: {user.get('is_admin', False)})")

        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token expired!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token!'}), 401
        except Exception as e:
            logger.error(f"Unexpected error in token decoding: {e}")
            return jsonify({'message': 'Token processing error'}), 500

        return f(user, *args, **kwargs)

    return decorated


@app.route("/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    is_admin = data.get("is_admin", False)  # Allow admin to set admin status

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    existing_user = users_collection.find_one({"username": username})
    if existing_user:
        return jsonify({"error": "Username already exists"}), 409

    hashed_pw = bcrypt.generate_password_hash(password).decode("utf-8")

    user_id = str(uuid.uuid4())
    users_collection.insert_one({
        "_id": user_id, 
        "username": username, 
        "password": hashed_pw,
        "is_admin": is_admin
    })

    return jsonify({"message": "User registered successfully!"}), 201


@app.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    user = users_collection.find_one({"username": username})
    if not user or not bcrypt.check_password_hash(user["password"], password):
        return jsonify({"error": "Invalid credentials"}), 401

    # If user has ObjectId _id, migrate to string _id and use that for token
    if not isinstance(user['_id'], str):
        try:
            str_id = str(user['_id'])
            user_data = dict(user)
            user_data['_id'] = str_id
            users_collection.insert_one(user_data)
            users_collection.delete_one({'_id': user['_id']})
            user = user_data
            print(f"[LOGIN MIGRATION] Migrated user {username} to string _id: {str_id}")
        except Exception as e:
            print(f"[LOGIN MIGRATION ERROR] {e}")

    token = jwt.encode({
        'user_id': str(user['_id']),
        'exp': datetime.now(timezone.utc) + timedelta(hours=1)
    }, SECRET_KEY, algorithm='HS256')

    return jsonify({
        "token": token,
        "is_admin": user.get("is_admin", False) if user else False
    })


@app.route("/chat/stream", methods=["POST"])
@token_required
def chat_stream(current_user):
    current_user = cast(dict, current_user)
    data = request.json
    query = data.get("query")
    context = data.get("context", "")
    chat_id = data.get("chat_id") 

    if not query:
        return jsonify({"error": "No query provided"}), 400
    if not chat_id:
        return jsonify({"error": "No chat_id provided"}), 400

    # If no context provided, perform retrieval
    if not context:
        chunks, retrieval_mode, answer = answer_query(query)
        print(f"[DEBUG] answer_query returned {len(chunks)} chunks")
        print(f"[DEBUG] First chunk structure: {type(chunks[0]) if chunks else 'No chunks'}")
        if chunks and len(chunks) > 0:
            print(f"[DEBUG] First chunk: {chunks[0]}")
            print(f"[DEBUG] First chunk type: {type(chunks[0])}")
            if isinstance(chunks[0], tuple):
                print(f"[DEBUG] First chunk[0] type: {type(chunks[0][0])}")
                print(f"[DEBUG] First chunk[1] type: {type(chunks[0][1])}")
                print(f"[DEBUG] First chunk[1] content: {chunks[0][1]}")
    else:
        chunks, retrieval_mode, answer = [], "context", ""

    # Use conversation context agent to handle follow-up questions
    contextual_result = conversation_context_agent.generate_contextual_response(
        query=query,
        user_id=str(current_user["_id"]),
        chat_id=chat_id,
        base_answer=answer,
        retrieved_context=context
    )
    final_answer = contextual_result["answer"]
    is_followup = contextual_result["is_followup"]


@app.route("/chat", methods=["POST"])
@token_required
def chat(current_user):
    start_time = time.time()
    current_user = cast(dict, current_user)
    data = request.json
    query = data.get("query")
    context = data.get("context", "")
    chat_id = data.get("chat_id") 

    if not query:
        return jsonify({"error": "No query provided"}), 400
    if not chat_id:
        return jsonify({"error": "No chat_id provided"}), 400

    try:
        # If no context provided, perform retrieval
        if not context:
            chunks, retrieval_mode, answer = answer_query(query)
            print(f"[DEBUG] answer_query returned {len(chunks)} chunks")
            print(f"[DEBUG] First chunk structure: {type(chunks[0]) if chunks else 'No chunks'}")
            if chunks and len(chunks) > 0:
                print(f"[DEBUG] First chunk: {chunks[0]}")
                print(f"[DEBUG] First chunk type: {type(chunks[0])}")
                if isinstance(chunks[0], tuple):
                    print(f"[DEBUG] First chunk[0] type: {type(chunks[0][0])}")
                    print(f"[DEBUG] First chunk[1] type: {type(chunks[0][1])}")
                    print(f"[DEBUG] First chunk[1] content: {chunks[0][1]}")
        else:
            chunks, retrieval_mode, answer = [], "context", ""

        # Use conversation context agent to handle follow-up questions
        contextual_result = conversation_context_agent.generate_contextual_response(
            query=query,
            user_id=str(current_user["_id"]),
            chat_id=chat_id,
            base_answer=answer,
            retrieved_context=context
        )
        final_answer = contextual_result["answer"]
        is_followup = contextual_result["is_followup"]

        # Extract used_chunks from the answer (if present)
        used_chunks = []
        if "[USED_CHUNKS:" in final_answer:
            try:
                used_chunks_section = final_answer.split("[USED_CHUNKS:")[1].split("]")[0]
                used_chunks = [int(x.strip()) for x in used_chunks_section.split(",") if x.strip().isdigit()]
                final_answer = final_answer.split("[USED_CHUNKS:")[0].strip()
            except:
                used_chunks = list(range(len(chunks)))
        else:
            used_chunks = list(range(len(chunks)))

        # Calculate response time and log analytics event
        response_time = time.time() - start_time
        
        # Log analytics event (commented out due to missing analytics service)
        # try:
        #     from analytics.service import AnalyticsService
        #     AnalyticsService.log_event(
        #         event_type='chat',
        #         agent_type='document',
        #         user_id=str(current_user["_id"]),
        #         session_id=chat_id,
        #         response_time=response_time,
        #         status='success',
        #         metadata={
        #             'query_length': len(query),
        #             'response_length': len(final_answer),
        #             'chunks_retrieved': len(chunks),
        #             'chunks_used': len(used_chunks),
        #             'is_followup': is_followup
        #         }
        #     )
        # except Exception as analytics_error:
        #     print(f"Failed to log analytics: {analytics_error}")

        def format_pdf_url(src):
            # Remove .pdf if present, then add .pdf once
            filename = src.split(' - Page ')[0]
            if filename.endswith('.pdf'):
                filename = filename[:-4]
            if ' - Page ' in src:
                page = src.split(' - Page ')[1]
                return f"/pdf/{filename}.pdf?page={page}"
            else:
                return f"/pdf/{filename}.pdf"

        sources = [
            {
                "id": f"source_{i}",
                "title": src,
                "url": format_pdf_url(src),
                "snippet": chunk[:200] + "..." if len(chunk) > 200 else chunk,
                "group": "Used by AI"
            } for i, (chunk, src) in enumerate(chunks)
        ]
        chats_collection.insert_one({
            "user_id": str(current_user["_id"]),
            "chat_id": chat_id,
            "question": query,
            "answer": final_answer,
            "context": context, 
            "sources": sources,
            "used_chunks": used_chunks,
            "timestamp": datetime.now(timezone.utc)
        })
        return jsonify({
            "answer": final_answer,
            "context": context,
            "sources": sources,
            "used_chunks": used_chunks,
            "is_followup": is_followup
        })
        
    except Exception as e:
        # Log error analytics event (commented out due to missing analytics service)
        response_time = time.time() - start_time
        # try:
        #     from analytics.service import AnalyticsService
        #     AnalyticsService.log_event(
        #         event_type='chat',
        #         agent_type='document',
        #         user_id=str(current_user["_id"]),
        #         session_id=chat_id,
        #         response_time=response_time,
        #         status='error',
        #         error_message=str(e)
        #     )
        # except:
        #     pass
        
        return jsonify({"error": f"Error processing chat: {str(e)}"}), 500

@app.route("/create-chat", methods=["POST"])
@token_required
def create_chat(current_user):
    try:
        # create chat logic...
        chat_id = str(uuid.uuid4())
        new_chat = {
            "id": chat_id, 
            "title": "New Chat",
            "createdAt": datetime.utcnow().isoformat()
        }
        # save to database or memory
        return jsonify(new_chat), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/chat/history", methods=["GET"])
@app.route("/doc/chat/history", methods=["GET"])
@token_required
def get_chat_history(current_user):
    user_id = str(current_user["_id"])

    # Fetch all messages for the user - sort by newest first
    all_chats = list(chats_collection.find({"user_id": user_id}).sort("timestamp", -1))  # -1 for DESCENDING

    chat_history = {}
    for entry in all_chats:
        if entry is None:
            continue
            
        chat_id = entry.get("chat_id", "unknown")

        # Format sources if they exist
        sources = entry.get("sources", [])
        
        if sources and isinstance(sources, list) and len(sources) > 0 and isinstance(sources[0], tuple):  # Old format (chunk, src) tuples
            formatted_sources = []
            for chunk, src in sources:
                if isinstance(src, str):
                    # Handle sources with page information like "filename.pdf - Page X"
                    if " - Page " in src:
                        filename = src.split(" - Page ")[0]  # Get part before " - Page "
                        page_info = src.split(" - Page ")[1]  # Get page number
                        # Remove .pdf extension if present
                        filename = filename.replace('.pdf', '') if filename.endswith('.pdf') else filename
                        # Create title with page info
                        title = f"{filename} - Page {page_info}"
                        # Create URL with page parameter
                        source_url = f"/pdf/{filename}.pdf?page={page_info}"
                    else:
                        filename = src.split('/')[-1] if '/' in src else src
                        # Remove .pdf extension if present
                        filename = filename.replace('.pdf', '') if filename.endswith('.pdf') else filename
                        title = filename
                        source_url = f"/pdf/{filename}.pdf"
                else:
                    filename = str(src)
                    title = filename
                    source_url = f"/pdf/{filename}.pdf"
                
                formatted_sources.append({
                    "id": f"source_{len(formatted_sources)}",
                    "title": title,  # Keep page info in title
                    "url": source_url,
                    "snippet": chunk[:200] + "..." if len(chunk) > 200 else chunk,
                    "group": "Used by AI"
                })
        else:
            # Handle sources that are already in the new format but might have page info in title/url
            formatted_sources = []
            for source in sources:
                if isinstance(source, dict) and 'title' in source and 'url' in source:
                    # Check if title contains page information
                    title = source['title']
                    if " - Page " in title:
                        clean_title = title.split(" - Page ")[0]
                        page_info = title.split(" - Page ")[1]
                        # Remove .pdf extension if present
                        clean_title = clean_title.replace('.pdf', '') if clean_title.endswith('.pdf') else clean_title
                        # Create URL with page parameter
                        clean_url = f"/pdf/{clean_title}.pdf?page={page_info}"
                        # Preserve page info in title
                        final_title = f"{clean_title} - Page {page_info}"
                        
                        formatted_sources.append({
                            "id": source.get('id', f"source_{len(formatted_sources)}"),
                            "title": final_title,
                            "url": clean_url,
                            "snippet": source.get('snippet', ''),
                            "group": source.get('group', 'Used by AI')
                        })
                    else:
                        formatted_sources.append(source)
                else:
                    formatted_sources.append(source)

        chat_data = {
            "_id": str(entry.get("_id")),
            "question": entry.get("question", ""),
            "answer": entry.get("answer", ""),
            "context": entry.get("context", ""),
            "sources": formatted_sources,
            "timestamp": entry.get("timestamp", datetime.utcnow().isoformat())
        }

        if chat_id not in chat_history:
            chat_history[chat_id] = []

        chat_history[chat_id].append(chat_data)

    return jsonify(chat_history)

# Place this route after app and all imports are defined
@app.route("/doc/chat/history/<chat_id>", methods=["DELETE", "OPTIONS"])
@cross_origin()
@token_required
def delete_doc_chat_history(current_user, chat_id):
    if request.method == "OPTIONS":
        return '', 204
    user_id = str(current_user["_id"])
    result = chats_collection.delete_many({"chat_id": chat_id, "user_id": user_id})
    if result.deleted_count > 0:
        return jsonify({"success": True, "deleted": result.deleted_count}), 200
    else:
        return jsonify({"error": "Chat not found or not authorized"}), 404

@app.route("/preview-excel", methods=["POST"])
def preview_excel():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files['file']
    df = pd.read_excel(file)
    preview = df.head(5).fillna("").astype(str).values.tolist()
    return jsonify({"preview": preview})


@app.route("/batch-process", methods=["POST"])
def batch_process():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    df = pd.read_excel(file)

    responses = []
    sources_list = []

    for _, row in df.iterrows():
        query = str(row.iloc[0]) if isinstance(row.iloc[0], str) else ""
        if not query.strip():
            responses.append("Invalid or empty query.")
            sources_list.append("")
            continue

        try:
            chunks, retrieval_mode, answer = answer_query(query)  # Get chunks and answer

            # Format the source into a clean string
            def format_source(src):
                if isinstance(src, dict):
                    return src.get("title") or src.get("id") or src.get("url") or json.dumps(src)
                if isinstance(src, (list, tuple)):
                    return " - ".join(str(x).strip() for x in src if x)
                return str(src).strip()

            # Generate context and sources
            context = "\n".join([f"[{format_source(src)}] {chunk}" for chunk, src in chunks])
            responses.append(answer)

            # Collect unique formatted source strings
            formatted_sources = list({format_source(src) for _, src in chunks})
            sources_list.append("; ".join(formatted_sources))

        except Exception as e:
            responses.append(f"Error: {str(e)}")
            sources_list.append("")

    df["Response"] = responses
    df["Sources"] = sources_list
    df.to_excel(PROCESSED_FILE_PATH, index=False)
    return jsonify({"download_url": "/download/processed"})


@app.route("/download/processed", methods=["GET"])
def download_processed():
    return send_from_directory(os.getcwd(), "processed_queries.xlsx", as_attachment=True)

@app.route("/pdf/<filename>")
def serve_pdf(filename):
    # Diagnostic: List all files in the files_dir
    try:
        all_files = os.listdir(files_dir)
        print(f"[DIAGNOSTIC] Files in {files_dir}:")
        for f in all_files:
            print(f"  - {f}")
    except Exception as diag_err:
        print(f"[DIAGNOSTIC] Could not list files: {diag_err}")
    # Clean up filename
    filename = re.sub(r'_enriched\.json.*', '.pdf', filename)
    filename = filename.replace("%20", " ", -1)

    # Ensure filename has .pdf extension
    if not filename.lower().endswith('.pdf'):
        filename += '.pdf'

    # Path to Ingestion/files folder
    files_dir = os.path.join(os.path.dirname(__file__), 'Ingestion', 'files')
    print(f"[DEBUG] Serving PDF from: {files_dir}")
    print(f"[DEBUG] Requested filename: {filename}")

    # Diagnostic: List all files in the files_dir
    try:
        all_files = os.listdir(files_dir)
        print(f"[DIAGNOSTIC] Files in {files_dir}:")
        for f in all_files:
            print(f"  - {f}")
    except Exception as diag_err:
        print(f"[DIAGNOSTIC] Could not list files: {diag_err}")

    # Case-insensitive and extension-insensitive matching
    filename_lower = filename.lower()
    matched_file = None
    for f in all_files:
        if f.lower() == filename_lower:
            matched_file = f
            break
    if not matched_file:
        # Try matching without .pdf extension
        filename_no_ext = filename_lower[:-4] if filename_lower.endswith('.pdf') else filename_lower
        for f in all_files:
            f_no_ext = f.lower()[:-4] if f.lower().endswith('.pdf') else f.lower()
            if f_no_ext == filename_no_ext:
                matched_file = f
                break

    if not matched_file:
        return jsonify({"error": "PDF file not found"}), 404

    response = send_from_directory(files_dir, matched_file)
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = f'inline; filename="{matched_file}"'
    return response

@app.route("/api/suggestions/follow-up", methods=["POST"])
@token_required
def get_follow_up_suggestions(current_user):
    data = request.json
    chat_history = data.get("chat_history", [])
    current_query = data.get("current_query", "")
    chat_id = data.get("chat_id")
    max_suggestions = data.get("max_suggestions", 6)
    
    # If no chat_history provided but chat_id is available, fetch from database
    if not chat_history and chat_id:
        try:
            # Get conversation history from database
            conversation_history = conversation_context_agent.get_conversation_history(
                current_user["_id"], chat_id, limit=10
            )
        except Exception as e:
            print(f"Error fetching conversation history: {e}")
            conversation_history = []
    else:
        # Convert chat history to conversation format for the agent
        conversation_history = []
        for msg in chat_history[-10:]:  # Last 5 exchanges (10 messages)
            if msg.get("role") == "user":
                conversation_history.append({
                    "role": "user",
                    "content": msg.get("content", "")
                })
            elif msg.get("role") == "assistant":
                conversation_history.append({
                    "role": "assistant",
                    "content": msg.get("content", "")
                })
    
    if not conversation_history:
        # If only a user message is present (first prompt), use it for suggestions
        if chat_history and len(chat_history) == 1 and chat_history[0].get("role") == "user":
            user_message = chat_history[0]["content"]
            # Use the new chat suggestion agent for first prompt suggestions
            suggestions = new_chat_suggestion_agent.suggest_new_chat_questions(
                user_message, max_suggestions=max_suggestions
            )
            return jsonify({"suggestions": suggestions})
        return jsonify({"suggestions": []})

    # Get the most recent answer for context
    current_answer = ""
    if conversation_history and conversation_history[-1]["role"] == "assistant":
        current_answer = conversation_history[-1]["content"]

    # Use conversation context agent for better suggestions
    suggestions = conversation_context_agent.suggest_followup_questions(
        conversation_history, current_answer, max_suggestions
    )

    # Ensure we return the requested number of suggestions
    suggestions = suggestions[:max_suggestions]

    return jsonify({"suggestions": suggestions})

@app.route("/api/suggestions/new-chat", methods=["POST"])
@token_required
def get_new_chat_suggestions(current_user):
    """
    Get suggestions for new chat questions.
    """
    data = request.json
    user_preference = data.get("preference", "")
    max_suggestions = data.get("max_suggestions", 5)
    
    try:
        suggestions = new_chat_suggestion_agent.suggest_new_chat_questions(
            max_suggestions=max_suggestions,
            user_preference=user_preference
        )
        
        return jsonify({"suggestions": suggestions})
        
    except Exception as e:
        print(f"Error getting new chat suggestions: {e}")
        return jsonify({"error": "Failed to generate suggestions"}), 500

@app.route("/api/suggestions/topic", methods=["POST"])
@token_required
def get_topic_suggestions(current_user):
    """
    Get topic-specific query suggestions.
    """
    data = request.json
    topic = data.get("topic")
    max_suggestions = data.get("max_suggestions", 3)
    
    if not topic:
        return jsonify({"error": "topic is required"}), 400
    
    try:
        suggestions = new_chat_suggestion_agent.suggest_topic_based_questions(
            topic=topic,
            max_suggestions=max_suggestions
        )
        
        return jsonify({"suggestions": suggestions})
        
    except Exception as e:
        print(f"Error getting topic suggestions: {e}")
        return jsonify({"error": "Failed to generate suggestions"}), 500

@app.route("/api/suggestions/clarifying", methods=["POST"])
@token_required
def get_clarifying_suggestions(current_user):
    """
    Get clarifying questions based on the last Q&A pair.
    """
    data = request.json
    chat_id = data.get("chat_id")
    
    if not chat_id:
        return jsonify({"error": "chat_id is required"}), 400
    
    try:
        # Get the most recent Q&A pair for this chat
        last_qa = chats_collection.find_one({
            "user_id": str(current_user["_id"]),
            "chat_id": chat_id
        }, sort=[("timestamp", -1)])  # Get the most recent
        
        if not last_qa:
            return jsonify({"suggestions": []})
        
        last_question = last_qa.get("question", "") if last_qa else ""
        last_answer = last_qa.get("answer", "") if last_qa else ""
        
        # Get clarifying suggestions
        suggestions = query_suggestion_agent.suggest_clarifying_queries(
            last_question=last_question,
            last_answer=last_answer,
            max_suggestions=2
        )
        
        return jsonify({"suggestions": suggestions})
        
    except Exception as e:
        print(f"Error getting clarifying suggestions: {e}")
        return jsonify({"error": "Failed to generate suggestions"}), 500

@app.route("/users", methods=["GET", "OPTIONS"])
@cross_origin()
@token_required
def list_users(current_user):
    if request.method == "OPTIONS":
        return '', 204
    if not current_user.get("is_admin", False):
        return jsonify({"error": "Admin access required"}), 403
    users = list(users_collection.find({}, {"password": 0}))
    for user in users:
        user["_id"] = str(user["_id"])
    return jsonify({"users": users})

@app.route("/users/<user_id>", methods=["DELETE", "OPTIONS"])
@cross_origin()
@token_required
def delete_user(current_user, user_id):
    if request.method == "OPTIONS":
        return '', 204
    if not current_user.get("is_admin", False):
        return jsonify({"error": "Admin access required"}), 403
    result = users_collection.delete_one({"_id": user_id})
    if result.deleted_count == 1:
        return jsonify({"success": True})
    else:
        return jsonify({"error": "User not found"}), 404

@app.route("/image-analysis", methods=["POST"])
@token_required
def image_analysis(current_user):
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
    image = request.files['image']
    if not image:
        return jsonify({"error": "No image provided"}), 400

    # Read image data
    image_data = image.read()
    
    # Use the image analysis agent
    result = image_analysis_agent.simple_analysis(image_data)
    
    # Store the analysis in database
    analysis_record = {
        "user_id": str(current_user["_id"]),
        "filename": image.filename,
        "content_type": image.content_type,
        "analysis_result": result,
        "analysis_type": "simple",
        "timestamp": datetime.now(timezone.utc),
        "file_size": len(image_data)
    }
    
    # Insert into database
    inserted_id = image_analysis_collection.insert_one(analysis_record).inserted_id
    
    return jsonify({
        "analysis_result": result,
        "analysis_id": str(inserted_id),
        "filename": image.filename
    })

@app.route("/analyze-image", methods=["POST"])
@token_required
def analyze_image(current_user):
    """
    Analyze an uploaded image using the Image Analysis Agent.
    Also store the result in the chat history (chats_collection).
    """
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Get optional parameters from form data
        prompt = request.form.get('prompt', '')
        encoding_type = request.form.get('encoding_type', 'base64')
        use_qwen = request.form.get('use_qwen', 'true').lower() == 'true'
        chat_id = request.form.get('chat_id')
        if not chat_id:
            # If not provided, generate a new chat_id (or you could require it)
            chat_id = str(uuid.uuid4())
        
        # Read the image data
        image_data = file.read()
        
        # Validate the image
        validation_result = image_analysis_agent.validate_image(image_data, file.content_type)
        if not validation_result.get("valid"):
            return jsonify({"error": validation_result.get("error", "Invalid image")}), 400
        
        # Analyze the image using the agent
        result = image_analysis_agent.analyze_image(
            image_data=image_data,
            prompt=prompt,
            encoding_type=encoding_type,
            use_qwen=use_qwen,
            content_type=file.content_type
        )
        
        if result.get("success"):
            # Store the analysis in database (image_analysis_collection)
            analysis_record = {
                "user_id": str(current_user["_id"]),
                "filename": file.filename,
                "content_type": file.content_type,
                "prompt": prompt,
                "encoding_type": encoding_type,
                "use_qwen": use_qwen,
                "analysis": result.get("analysis", ""),
                "model_used": result.get("model_used", ""),
                "device_used": result.get("device_used", ""),
                "encoding_info": result.get("encoding_info", {}),
                "qwen_available": result.get("qwen_available", False),
                "advanced_encoder_available": result.get("advanced_encoder_available", False),
                "analysis_type": "detailed",
                "timestamp": datetime.now(timezone.utc),
                "file_size": len(image_data),
                "validation_info": validation_result
            }
            inserted_id = image_analysis_collection.insert_one(analysis_record).inserted_id
            # Add analysis_id to the response
            result["analysis_id"] = str(inserted_id)
            result["filename"] = file.filename
            result["content_type"] = file.content_type

            # --- Store in chat history (chats_collection) ---
            chat_record = {
                "user_id": str(current_user["_id"]),
                "chat_id": chat_id,
                "question": prompt or "[Image Analysis]",
                "answer": result.get("analysis", ""),
                "image": {
                    "filename": file.filename,
                    "content_type": file.content_type,
                    # Optionally, you could store a reference to the image or a base64 string
                },
                "timestamp": datetime.now(timezone.utc),
                "analysis_id": str(inserted_id),
                "analysis_type": "image"
            }
            chats_collection.insert_one(chat_record)
            # ---

            return jsonify(result)
        else:
            return jsonify({"error": result.get("error", "Failed to analyze image")}), 500
        
    except Exception as e:
        print(f"Error analyzing image: {e}")
        return jsonify({"error": "Failed to analyze image"}), 500

@app.route("/image-analysis/info", methods=["GET"])
@token_required
def get_image_analysis_info(current_user):
    """
    Get information about available image analysis models and encoders.
    """
    try:
        info = image_analysis_agent.get_analysis_info()
        return jsonify(info)
        
    except Exception as e:
        print(f"Error getting image analysis info: {e}")
        return jsonify({"error": "Failed to get analysis info"}), 500

@app.route("/image-analysis/history", methods=["GET"])
@token_required
def get_image_analysis_history(current_user):
    """
    Get image analysis history for the current user.
    """
    try:
        user_id = str(current_user["_id"])
        
        # Fetch all image analyses for the user - sort by newest first
        all_analyses = list(image_analysis_collection.find({"user_id": user_id}).sort("timestamp", -1))
        
        # Format the analyses for frontend
        formatted_analyses = []
        for analysis in all_analyses:
            if analysis is None:
                continue
                
            formatted_analysis = {
                "_id": str(analysis.get("_id")),
                "filename": analysis.get("filename", ""),
                "content_type": analysis.get("content_type", ""),
                "prompt": analysis.get("prompt", ""),
                "analysis": analysis.get("analysis", analysis.get("analysis_result", "")),
                "model_used": analysis.get("model_used", ""),
                "device_used": analysis.get("device_used", ""),
                "encoding_type": analysis.get("encoding_type", ""),
                "analysis_type": analysis.get("analysis_type", "simple"),
                "timestamp": analysis.get("timestamp", datetime.utcnow()).isoformat(),
                "file_size": analysis.get("file_size", 0),
                "encoding_info": analysis.get("encoding_info", {}),
                "validation_info": analysis.get("validation_info", {})
            }
            
            formatted_analyses.append(formatted_analysis)
        
        return jsonify({
            "analyses": formatted_analyses,
            "total_count": len(formatted_analyses)
        })
        
    except Exception as e:
        print(f"Error getting image analysis history: {e}")
        return jsonify({"error": "Failed to get analysis history"}), 500

@app.route("/image-analysis/<analysis_id>", methods=["GET"])
@token_required
def get_image_analysis_by_id(current_user, analysis_id):
    """
    Get a specific image analysis by ID.
    """
    try:
        user_id = str(current_user["_id"])
        
        # Find the analysis by ID and user
        analysis = image_analysis_collection.find_one({
            "_id": analysis_id,
            "user_id": user_id
        })
        
        if not analysis:
            return jsonify({"error": "Analysis not found"}), 404
        
        # Format the analysis
        formatted_analysis = {
            "_id": str(analysis.get("_id")),
            "filename": analysis.get("filename", ""),
            "content_type": analysis.get("content_type", ""),
            "prompt": analysis.get("prompt", ""),
            "analysis": analysis.get("analysis", analysis.get("analysis_result", "")),
            "model_used": analysis.get("model_used", ""),
            "device_used": analysis.get("device_used", ""),
            "encoding_type": analysis.get("encoding_type", ""),
            "analysis_type": analysis.get("analysis_type", "simple"),
            "timestamp": analysis.get("timestamp", datetime.utcnow()).isoformat(),
            "file_size": analysis.get("file_size", 0),
            "encoding_info": analysis.get("encoding_info", {}),
            "validation_info": analysis.get("validation_info", {}),
            "qwen_available": analysis.get("qwen_available", False),
            "advanced_encoder_available": analysis.get("advanced_encoder_available", False)
        }
        
        return jsonify(formatted_analysis)
        
    except Exception as e:
        print(f"Error getting image analysis by ID: {e}")
        return jsonify({"error": "Failed to get analysis"}), 500

@app.route("/image-analysis/<analysis_id>", methods=["DELETE"])
@token_required
def delete_image_analysis(current_user, analysis_id):
    """
    Delete a specific image analysis by ID.
    """
    try:
        user_id = str(current_user["_id"])
        
        # Delete the analysis by ID and user
        result = image_analysis_collection.delete_one({
            "_id": analysis_id,
            "user_id": user_id
        })
        
        if result.deleted_count == 1:
            return jsonify({"success": True, "message": "Analysis deleted successfully"})
        else:
            return jsonify({"error": "Analysis not found"}), 404
        
    except Exception as e:
        print(f"Error deleting image analysis: {e}")
        return jsonify({"error": "Failed to delete analysis"}), 500

@app.route("/admin/ingest", methods=["POST"])
@token_required
def admin_ingest(current_user):
    """
    Admin-only endpoint for ingesting documents into the vector database.
    Only admins can access this endpoint.
    """
    current_user = cast(dict, current_user)
    
    # Check if user is admin
    if not current_user.get("is_admin", False):
        return jsonify({"error": "Only administrators can ingest documents"}), 403
    
    # Check if file was uploaded
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    # Validate file type
    allowed_extensions = {'.pdf', '.docx', '.xlsx', '.xls', '.csv', '.json', '.md', '.png', '.jpg', '.jpeg', '.bmp', '.tiff'}
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        return jsonify({"error": f"Unsupported file type: {file_ext}"}), 400
    
    try:
        # Create a temporary directory for processing
        with tempfile.TemporaryDirectory() as temp_dir:
            # Save the uploaded file
            file_path = os.path.join(temp_dir, file.filename)
            file.save(file_path)
            
            # Process the file based on its type
            chunks_processed = 0
            
            if file_ext == '.pdf':
                page_data = load_pdf_with_metadata(file_path)
                chunks_with_metadata = []
                
                for text, page_metadata in page_data:
                    if len(text) > 15000:  # Large page threshold
                        sub_chunks = chunk_text_with_metadata(text, metadata=page_metadata)
                        chunks_with_metadata.extend(sub_chunks)
                    else:
                        chunk_metadata = page_metadata.copy()
                        chunk_metadata.update({
                            'chunk_start': 0,
                            'chunk_end': len(text),
                            'chunk_index': 0,
                            'is_sub_chunk': False
                        })
                        chunks_with_metadata.append((text, chunk_metadata))
                
                chunks_processed = len(chunks_with_metadata)
                
            elif file_ext == '.docx':
                text = load_docx(file_path)
                base_metadata = {
                    "file_name": file.filename,
                    "file_type": file_ext.replace('.', ''),
                    "word_count": len(text.split()),
                    "char_count": len(text),
                    "ingested_at": datetime.now().isoformat(),
                    "is_table": False,
                    "page_number": -1,
                    "source_type": file_ext.replace('.', '')
                }
                chunks_with_metadata = chunk_text_with_metadata(text, metadata=base_metadata)
                chunks_processed = len(chunks_with_metadata)
                
            elif file_ext in ['.xlsx', '.xls']:
                text = load_excel(file_path)
                base_metadata = {
                    "file_name": file.filename,
                    "file_type": file_ext.replace('.', ''),
                    "word_count": len(text.split()),
                    "char_count": len(text),
                    "ingested_at": datetime.now().isoformat(),
                    "is_table": False,
                    "page_number": -1,
                    "source_type": file_ext.replace('.', '')
                }
                chunks_with_metadata = chunk_text_with_metadata(text, metadata=base_metadata)
                chunks_processed = len(chunks_with_metadata)
                
            elif file_ext == '.csv':
                text = load_csv(file_path)
                base_metadata = {
                    "file_name": file.filename,
                    "file_type": file_ext.replace('.', ''),
                    "word_count": len(text.split()),
                    "char_count": len(text),
                    "ingested_at": datetime.now().isoformat(),
                    "is_table": False,
                    "page_number": -1,
                    "source_type": file_ext.replace('.', '')
                }
                chunks_with_metadata = chunk_text_with_metadata(text, metadata=base_metadata)
                chunks_processed = len(chunks_with_metadata)
                
            elif file_ext in ['.png', '.jpg', '.jpeg', '.bmp', '.tiff']:
                text = load_image(file_path)
                base_metadata = {
                    "file_name": file.filename,
                    "file_type": file_ext.replace('.', ''),
                    "word_count": len(text.split()),
                    "char_count": len(text),
                    "ingested_at": datetime.now().isoformat(),
                    "is_table": False,
                    "page_number": -1,
                    "source_type": file_ext.replace('.', '')
                }
                chunks_with_metadata = chunk_text_with_metadata(text, metadata=base_metadata)
                chunks_processed = len(chunks_with_metadata)

                # --- NEW: Save image to rag_frontend/pdf/pic/ ---
                pic_dir = os.path.join(os.path.dirname(__file__), 'rag_frontend', 'pdf', 'pic')
                os.makedirs(pic_dir, exist_ok=True)
                dest_path = os.path.join(pic_dir, file.filename)
                shutil.copy2(file_path, dest_path)

                # --- NEW: Generate CLIP embedding and LLM description ---
                try:
                    clip_embedding = embed_image_clip(dest_path)
                except Exception as e:
                    print(f"[ERROR] CLIP embedding failed: {e}")
                    clip_embedding = None
                try:
                    image_description = describe_image_with_ollama(dest_path)
                except Exception as e:
                    print(f"[ERROR] LLM description failed: {e}")
                    image_description = "[NO DESCRIPTION]"

                # --- NEW: Add to Agentic_RAGv2_CLIP collection ---
                try:
                    from qdrant_client import QdrantClient
                    from qdrant_client.http import models
                    clip_client = QdrantClient(url="http://localhost:6333")
                    clip_collection = "Agentic_RAGv2_CLIP"
                    # Ensure CLIP collection exists
                    existing_collections = clip_client.get_collections().collections
                    if clip_collection not in [c.name for c in existing_collections]:
                        clip_client.create_collection(
                            collection_name=clip_collection,
                            vectors_config=models.VectorParams(size=1536, distance=models.Distance.COSINE),
                            optimizers_config=models.OptimizersConfigDiff(indexing_threshold=0)
                        )
                    # Get current point count for ID generation
                    collection_info = clip_client.get_collection(clip_collection)
                    current_count = collection_info.points_count or 0
                    if clip_embedding is not None:
                        clip_metadata = base_metadata.copy()
                        clip_metadata.update({
                            "vector_type": "clip",
                            "text": f"Image: {file.filename}\nDescription: {image_description}",
                            "image_file": file.filename,
                            "image_path": dest_path,
                            "content_type": "image",
                            "description": image_description,
                            "has_ocr": bool(text.strip()),
                            "ocr_text": text,
                            "ingested_at": datetime.now().isoformat(),
                        })
                        clip_client.upsert(collection_name=clip_collection, points=[models.PointStruct(
                            id=str(uuid.uuid4()),
                            vector=clip_embedding,
                            payload=clip_metadata
                        )])
                        print(f"[INFO] Image {file.filename} added to Agentic_RAGv2_CLIP with description.")
                except Exception as e:
                    print(f"[ERROR] Failed to add image to CLIP collection: {e}")
                
            elif file_ext == '.md':
                text = load_markdown_file(file_path)
                base_metadata = {
                    "file_name": file.filename,
                    "file_type": file_ext.replace('.', ''),
                    "word_count": len(text.split()),
                    "char_count": len(text),
                    "ingested_at": datetime.now().isoformat(),
                    "is_table": False,
                    "page_number": -1,
                    "source_type": file_ext.replace('.', '')
                }
                chunks_with_metadata = chunk_text_with_metadata(text, metadata=base_metadata)
                chunks_processed = len(chunks_with_metadata)
                
            elif file_ext == '.json':
                chunks_with_metadata = load_json(file_path)
                chunks_processed = len(chunks_with_metadata)
            
            # Process chunks and add to vector database
            from qdrant_client import QdrantClient
            from qdrant_client.http import models
            
            client = QdrantClient(url="http://localhost:6333")
            collection_name = "Agentic_RAGv2"
            
            # Ensure collection exists
            existing_collections = client.get_collections().collections
            if collection_name not in [c.name for c in existing_collections]:
                client.create_collection(
                    collection_name=collection_name,
                    vectors_config=models.VectorParams(size=1536, distance=models.Distance.COSINE),
                    optimizers_config=models.OptimizersConfigDiff(indexing_threshold=0)
                )
            
            # Get current point count for ID generation
            collection_info = client.get_collection(collection_name)
            current_count = collection_info.points_count
            
            # Process and upload chunks
            points = []
            for i, (text, metadata) in enumerate(chunks_with_metadata):
                try:
                    embedding = embed_chunks(text)
                    payload = {"text": text}
                    payload.update(metadata)
                    
                    # Ensure list fields are properly formatted
                    list_fields = ["keywords", "other_brands", "dates", "serial_nums", "part_nums", "aircraft_names"]
                    for field in list_fields:
                        if field in payload and not isinstance(payload[field], list):
                            payload[field] = [payload[field]] if payload[field] else []
                    
                    points.append(models.PointStruct(
                        id=current_count + i,
                        vector=embedding,
                        payload=payload
                    ))
                    
                except Exception as e:
                    print(f"Error processing chunk {i}: {e}")
                    continue
            
            # Upload points to Qdrant
            if points:
                client.upsert(collection_name=collection_name, points=points)
                print(f"Successfully ingested {len(points)} chunks from {file.filename}")
            
            return jsonify({
                "success": True,
                "message": f"Successfully ingested {file.filename}",
                "chunks_processed": len(points),
                "filename": file.filename
            })
            
    except Exception as e:
        print(f"Error during ingestion: {e}")
        return jsonify({"error": f"Failed to ingest file: {str(e)}"}), 500

if __name__ == "__main__":
    # Print all users on startup for easy reference
    print("\n[STARTUP] Users in database:")
    all_users = list(users_collection.find({}, {"_id": 1, "username": 1}))
    for u in all_users:
        print(f"  _id: {u.get('_id')}, username: {u.get('username')}")
    print("[STARTUP] End of user list.\n")
    app.run(port=5000, debug=True,use_reloader=False)
