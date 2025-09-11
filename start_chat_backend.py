#!/usr/bin/env python3
"""
KMRL Chat Backend Startup Script
"""

import sys
import os
import subprocess
import time

def check_python_version():
    """Check if Python version is 3.8+"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ is required")
        return False
    print(f"✅ Python {sys.version.split()[0]} found")
    return True

def check_and_install_requirements():
    """Check and install required packages"""
    try:
        print("📦 Installing/updating requirements...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "chat_requirements.txt"], 
                      check=True, capture_output=True)
        print("✅ Requirements installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install requirements: {e}")
        return False

def check_service(service_name, url, description):
    """Check if a service is running"""
    try:
        import requests
        response = requests.get(url, timeout=2)
        if response.status_code == 200:
            print(f"✅ {description} is running")
            return True
        else:
            print(f"⚠️ {description} responded with status {response.status_code}")
            return False
    except:
        print(f"❌ {description} is not accessible at {url}")
        return False

def check_gemini_config():
    """Check if Gemini API key is configured"""
    try:
        import os
        api_key = os.getenv('GEMINI_API_KEY')
        if api_key and api_key != 'your-gemini-api-key-here':
            print("✅ Gemini API key is configured")
            return True
        else:
            print("❌ Gemini API key is not configured")
            return False
    except Exception as e:
        print(f"❌ Error checking Gemini config: {e}")
        return False

def main():
    print("🚀 Starting KMRL Chat Backend...")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Install requirements
    if not check_and_install_requirements():
        sys.exit(1)
    
    # Check external services
    print("\n🔍 Checking external services...")
    
    gemini_ok = check_gemini_config()
    qdrant_ok = check_service("Qdrant", "http://localhost:6333/collections", "Qdrant Vector DB")
    
    if not gemini_ok:
        print("\n⚠️ Gemini API key is not configured. Please:")
        print("   1. Get API key from https://makersuite.google.com/app/apikey")
        print("   2. Set GEMINI_API_KEY in your .env file")
        print("   3. Restart the backend")
    
    if not qdrant_ok:
        print("\n⚠️ Qdrant is not running. Please:")
        print("   1. Install Docker")
        print("   2. Run: docker run -p 6333:6333 qdrant/qdrant")
        print("   Or install Qdrant locally")
    
    if not (gemini_ok and qdrant_ok):
        print("\n❌ Required services are not available.")
        print("The backend will start but may not function properly.")
        input("Press Enter to continue anyway, or Ctrl+C to exit...")
    
    # Start the backend
    print("\n🎯 Starting chat backend on http://localhost:5001")
    print("🔄 Press Ctrl+C to stop the server")
    print("=" * 50)
    
    try:
        # Import and run the backend
        from chat_backend import app
        app.run(host='0.0.0.0', port=5001, debug=True)
    except KeyboardInterrupt:
        print("\n\n👋 Chat backend stopped")
    except Exception as e:
        print(f"\n❌ Error starting backend: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()