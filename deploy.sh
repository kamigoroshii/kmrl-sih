#!/bin/bash

# Backend Deployment Script
echo "🚀 Starting RAG Backend Deployment..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip first."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️ Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp env_template.txt .env
    echo "📝 Please edit .env file with your configuration before running the server."
    echo "   Required variables:"
    echo "   - OPENAI_API_KEY"
    echo "   - MONGODB_URI"
    echo "   - JWT_SECRET_KEY"
    echo "   - QDRANT_HOST"
    echo "   - QDRANT_PORT"
fi

# Create uploads directory if it doesn't exist
if [ ! -d "uploads" ]; then
    echo "📁 Creating uploads directory..."
    mkdir -p uploads
fi

# Create static directory if it doesn't exist
if [ ! -d "static" ]; then
    echo "📁 Creating static directory..."
    mkdir -p static
fi

echo "✅ Backend setup complete!"
echo ""
echo "To start the server:"
echo "1. Edit .env file with your configuration"
echo "2. Run: python rag_backend.py"
echo ""
echo "Or use the start script:"
echo "./start.sh" 