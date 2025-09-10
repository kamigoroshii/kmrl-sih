#!/usr/bin/env python
"""
Qdrant Collection Creation Script

This script creates a new Qdrant collection with specified parameters.
It can be used to create custom collections for different document sets
or different embedding models.
"""

import argparse
import sys
import os
from qdrant_client import QdrantClient
from qdrant_client.http import models
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_collection(
    collection_name, 
    vector_size=1536, 
    distance="cosine", 
    host=None, 
    port=None,
    with_payload=True
):
    """
    Create a new Qdrant collection with the specified parameters.
    
    Args:
        collection_name (str): Name of the collection to create
        vector_size (int): Dimensionality of the vectors to store
        distance (str): Distance metric to use (cosine, euclid, dot)
        host (str): Qdrant server host
        port (int): Qdrant server port
        with_payload (bool): Whether to create payload indexes
    
    Returns:
        bool: True if collection was created successfully, False otherwise
    """
    # Use environment variables as defaults if not provided
    host = host or os.getenv("QDRANT_HOST", "localhost")
    port = port or int(os.getenv("QDRANT_PORT", 6333))
    
    # Map string distance name to Qdrant Distance enum
    distance_map = {
        "cosine": models.Distance.COSINE,
        "euclid": models.Distance.EUCLID,
        "dot": models.Distance.DOT
    }
    
    if distance not in distance_map:
        print(f"Error: Invalid distance metric '{distance}'. Must be one of: {', '.join(distance_map.keys())}")
        return False
    
    try:
        # Connect to Qdrant
        print(f"Connecting to Qdrant at {host}:{port}...")
        client = QdrantClient(host=host, port=port)
        
        # Check if collection already exists
        collections = client.get_collections().collections
        collection_names = [c.name for c in collections]
        
        if collection_name in collection_names:
            print(f"Collection '{collection_name}' already exists.")
            overwrite = input("Do you want to recreate it? (y/N): ").lower() == 'y'
            if overwrite:
                print(f"Deleting existing collection '{collection_name}'...")
                client.delete_collection(collection_name=collection_name)
            else:
                print("Operation cancelled.")
                return False
        
        # Create the collection
        print(f"Creating collection '{collection_name}' with vector size {vector_size}...")
        client.create_collection(
            collection_name=collection_name,
            vectors_config=models.VectorParams(
                size=vector_size,
                distance=distance_map[distance]
            ),
            optimizers_config=models.OptimizersConfigDiff(
                indexing_threshold=0  # Create index immediately
            )
        )
        
        # Create payload indexes for common fields if requested
        if with_payload:
            print("Creating payload indexes...")
            payload_indexes = [
                models.PayloadSchemaType.KEYWORD,  # For exact match
                models.PayloadSchemaType.TEXT      # For full-text search
            ]
            
            # Common fields to index
            fields_to_index = [
                "text",         # Document text
                "source",       # Document source
                "file_name",    # File name
                "page_number",  # Page number
                "title"         # Document title
            ]
            
            for field in fields_to_index:
                for schema_type in payload_indexes:
                    try:
                        client.create_payload_index(
                            collection_name=collection_name,
                            field_name=field,
                            field_schema=schema_type
                        )
                    except Exception as e:
                        print(f"Warning: Could not create index for {field}: {e}")
        
        print(f"✅ Collection '{collection_name}' created successfully!")
        return True
        
    except Exception as e:
        print(f"Error creating collection: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Create a new Qdrant collection")
    parser.add_argument("collection_name", help="Name of the collection to create")
    parser.add_argument("--vector-size", type=int, default=1536, 
                        help="Dimensionality of the vectors (default: 1536)")
    parser.add_argument("--distance", choices=["cosine", "euclid", "dot"], default="cosine",
                        help="Distance metric to use (default: cosine)")
    parser.add_argument("--host", help="Qdrant server host (default: from env or localhost)")
    parser.add_argument("--port", type=int, help="Qdrant server port (default: from env or 6333)")
    parser.add_argument("--no-payload-indexes", action="store_true", 
                        help="Don't create payload indexes")
    
    args = parser.parse_args()
    
    success = create_collection(
        collection_name=args.collection_name,
        vector_size=args.vector_size,
        distance=args.distance,
        host=args.host,
        port=args.port,
        with_payload=not args.no_payload_indexes
    )
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
