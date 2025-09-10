#!/bin/bash

# Start RAG Backend Server
echo "🚀 Starting RAG Backend Server..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run ./deploy.sh first."
    exit 1
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please run ./deploy.sh first."
    exit 1
fi

# Check if required services are running
echo "🔍 Checking required services..."

# Check MongoDB (optional check)
if command -v mongod &> /dev/null; then
    if ! pgrep -x "mongod" > /dev/null; then
        echo "⚠️  MongoDB is not running. Please start MongoDB first."
        echo "   On Ubuntu/Debian: sudo systemctl start mongod"
        echo "   On macOS: brew services start mongodb-community"
        echo "   On Windows: Start MongoDB service"
    fi
fi

# Check Qdrant (optional check)
if command -v qdrant &> /dev/null; then
    if ! pgrep -x "qdrant" > /dev/null; then
        echo "⚠️  Qdrant is not running. Please start Qdrant first."
        echo "   Run: qdrant"
    fi
fi

# Start the Flask server
echo "🌐 Starting Flask server..."
echo "   Server will be available at: http://localhost:5000"
echo "   Press Ctrl+C to stop the server"
echo ""

python rag_backend.py 