# RAG Backend System

A comprehensive backend system for Retrieval-Augmented Generation (RAG) with document processing, chat functionality, and image analysis capabilities.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- MongoDB
- Qdrant Vector Database
- OpenAI API Key

### Installation

1. **Clone and setup:**
   ```bash
   cd backend
   chmod +x deploy.sh start.sh
   ./deploy.sh
   ```

2. **Configure environment:**
   ```bash
   cp env_template.txt .env
   # Edit .env with your configuration
   ```

3. **Start the server:**
   ```bash
   ./start.sh
   ```

## 📁 Project Structure

```
backend/
├── rag_backend.py              # Main Flask application
├── rag_toolkit.py              # Core RAG functionality
├── llm.py                      # LLM integration
├── config.py                   # Configuration management
├── requirements.txt            # Python dependencies
├── deploy.sh                   # Deployment script
├── start.sh                    # Start script
├── env_template.txt            # Environment template
├── agents/                     # AI agents
│   ├── conversation_context_agent.py
│   ├── query_suggestion_agent.py
│   ├── image_analysis_agent.py
│   ├── new_chat_suggestion_agent.py
│   ├── context_validator_agent.py
│   ├── answer_validator_agent.py
│   ├── answer_synthesizer_agent.py
│   ├── query_analyzer_agent.py
│   ├── query_rephrase_agent.py
│   ├── context_analyst_agent.py
│   ├── query_splitter_agent.py
│   ├── introspector_agent.py
│   └── retriever_agent.py
└── tools/                      # Utility tools
    ├── loader.py
    ├── embedder.py
    ├── chunker.py
    ├── retriever.py
    ├── new_llamaparse.py
    ├── doclayout_yolo_wrapper.py
    ├── scraper.py
    ├── introspector.py
    └── acronyms.py
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
FLASK_SECRET_KEY=your-secret-key

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/rag_system
MONGODB_DB=rag_system

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini

# Qdrant Configuration
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_COLLECTION_NAME=documents

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Server Configuration
HOST=0.0.0.0
PORT=5000
```

## 📡 API Endpoints

### Authentication
- `POST /register` - User registration
- `POST /login` - User login
- `GET /users` - List users (admin)
- `DELETE /users/<user_id>` - Delete user (admin)

### Chat
- `POST /chat/stream` - Streaming chat response
- `POST /chat` - Regular chat response
- `POST /create-chat` - Create new chat
- `GET /chat/history` - Get chat history

### Suggestions
- `POST /suggestions/follow-up` - Follow-up questions (4-8 questions)
- `POST /suggestions/new-chat` - New chat suggestions
- `POST /suggestions/topic` - Topic-based suggestions
- `POST /suggestions/clarifying` - Clarifying questions

### Image Analysis
- `POST /image-analysis` - Analyze image
- `POST /analyze-image` - Alternative image analysis
- `GET /image-analysis/info` - Get analysis info
- `GET /image-analysis/history` - Get analysis history
- `GET /image-analysis/<analysis_id>` - Get specific analysis
- `DELETE /image-analysis/<analysis_id>` - Delete analysis

### File Management
- `POST /preview-excel` - Preview Excel files
- `POST /batch-process` - Batch process files
- `GET /download/processed` - Download processed files
- `GET /pdf/<filename>` - Serve PDF files

### Admin
- `POST /admin/ingest` - Admin document ingestion

## 🤖 AI Agents

### Conversation Context Agent
- Manages conversation history
- Generates contextual responses
- Suggests follow-up questions (4-8 questions)
- Considers 5-10 previous exchanges for context

### Query Suggestion Agent
- Generates follow-up queries
- Provides clarifying questions
- Suggests new chat topics

### Image Analysis Agent
- Analyzes uploaded images
- Extracts text and information
- Provides detailed analysis

### Other Specialized Agents
- Context validation
- Answer synthesis
- Query analysis and rephrasing
- Document retrieval

## 🛠️ Development

### Running in Development Mode
```bash
export FLASK_ENV=development
export FLASK_DEBUG=True
python rag_backend.py
```

### Running Tests
```bash
python -m pytest tests/
```

### Code Formatting
```bash
black .
isort .
```

## 🚀 Deployment

### Production Deployment
1. Set `FLASK_ENV=production`
2. Configure production database
3. Set up reverse proxy (nginx)
4. Use gunicorn or uwsgi

### Docker Deployment
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["python", "rag_backend.py"]
```

## 📊 Monitoring

### Health Check
- `GET /health` - Server health status

### Logging
- Application logs: `logs/app.log`
- Error logs: `logs/error.log`
- Access logs: `logs/access.log`

## 🔒 Security

- JWT-based authentication
- CORS protection
- Input validation
- Rate limiting
- File upload restrictions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints 