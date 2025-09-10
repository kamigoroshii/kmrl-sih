#!/usr/bin/env python
"""
Custom Qdrant Ingestion Script

This script ingests documents into a specified Qdrant collection.
It uses the document_agent's existing tools for document loading and embedding.
"""

import os
import sys
import argparse
from pathlib import Path
import time
import datetime
from dotenv import load_dotenv

# Add the current directory to the path so we can import document_agent modules
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(script_dir)

# Import the required modules from document_agent
from tools.loader import (
    load_pdf, load_docx, load_excel, load_csv, load_image, 
    load_markdown_file, load_json, load_pdf_with_metadata
)
from tools.chunker import chunk_text_with_metadata
from tools.embedder import embed_chunks
from Ingestion.clip_embedder import embed_image_clip

# Import Qdrant client
from qdrant_client import QdrantClient
from qdrant_client.http import models

# Load environment variables
load_dotenv()

# ...existing code...
