import requests
import os

# Configuration
BACKEND_URL = "http://localhost:5001"
DATA_FOLDER = "data"

def upload_file(file_path, filename):
    """Upload a single file to the backend"""
    try:
        with open(file_path, 'rb') as f:
            files = {'file': (filename, f, 'application/pdf')}
            response = requests.post(f"{BACKEND_URL}/upload", files=files)
            
        if response.status_code == 200:
            result = response.json()
            print(f"✅ {filename}: {result['message']}")
            print(f"   Chunks created: {result['chunks_created']}")
        else:
            print(f"❌ {filename}: {response.text}")
            
    except Exception as e:
        print(f"❌ Error uploading {filename}: {e}")

def upload_all_documents():
    """Upload all PDF files from the data folder"""
    if not os.path.exists(DATA_FOLDER):
        print(f"❌ Data folder '{DATA_FOLDER}' not found!")
        return
    
    print("🚀 Uploading documents to simple backend...")
    
    # Get all PDF files
    pdf_files = [f for f in os.listdir(DATA_FOLDER) if f.lower().endswith('.pdf')]
    
    if not pdf_files:
        print("❌ No PDF files found in data folder!")
        return
    
    print(f"📁 Found {len(pdf_files)} PDF files:")
    for file in pdf_files:
        print(f"   - {file}")
    
    print("\n📤 Starting upload...")
    
    # Upload each file
    for filename in pdf_files:
        file_path = os.path.join(DATA_FOLDER, filename)
        upload_file(file_path, filename)
    
    # Check final status
    print("\n📊 Checking backend status...")
    try:
        response = requests.get(f"{BACKEND_URL}/status")
        if response.status_code == 200:
            status = response.json()
            print(f"✅ Documents in database: {status['documents_count']}")
        else:
            print("❌ Could not check status")
    except Exception as e:
        print(f"❌ Error checking status: {e}")

if __name__ == "__main__":
    upload_all_documents()
