import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection settings from environment variables
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGODB_DB_NAME", "document_agent_db")

# Create MongoDB client
try:
    mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    # Verify connection
    mongo_client.server_info()
    print(f"[MongoDB] Connected to {MONGODB_URI}")
    
    # Get database
    db = mongo_client[DB_NAME]
    
    # Initialize collections
    users_collection = db["users"]
    document_agent_chats_collection = db["document_agent_chats"]
    
    # Create indexes
    users_collection.create_index("username", unique=True)
    users_collection.create_index("email", unique=True)
    document_agent_chats_collection.create_index("user_id")
    document_agent_chats_collection.create_index("timestamp")
    
    print(f"[MongoDB] Successfully connected to database: {DB_NAME}")
    
except Exception as e:
    print(f"[MongoDB] Error connecting to MongoDB: {e}")
    # Create fallback in-memory data structures if MongoDB connection fails
    print("[MongoDB] Using in-memory fallback data structures")
    
    class InMemoryCollection:
        def __init__(self):
            self.data = {}
            self._id_counter = 1
        
        def insert_one(self, document):
            document["_id"] = self._id_counter
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
        
        def update_one(self, query, update, upsert=False):
            for doc_id, doc in self.data.items():
                match = all(doc.get(k) == v for k, v in query.items())
                if match:
                    for key, value in update.get("$set", {}).items():
                        doc[key] = value
                    return
            if upsert:
                new_doc = {}
                for k, v in query.items():
                    new_doc[k] = v
                for k, v in update.get("$set", {}).items():
                    new_doc[k] = v
                self.insert_one(new_doc)
        
        def delete_one(self, query):
            for doc_id, doc in list(self.data.items()):
                match = all(doc.get(k) == v for k, v in query.items())
                if match:
                    del self.data[doc_id]
                    return
        
        def create_index(self, field, unique=False):
            # Just a placeholder for the in-memory version
            pass
    
    class MockMongoClient:
        def __init__(self):
            self.db = {"users": InMemoryCollection(), "document_agent_chats": InMemoryCollection()}
        
        def __getitem__(self, key):
            return self.db
    
    mongo_client = MockMongoClient()
    users_collection = mongo_client.db["users"]
    document_agent_chats_collection = mongo_client.db["document_agent_chats"]
