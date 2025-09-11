import os
import json
import datetime
import sys
from qdrant_client import QdrantClient
from qdrant_client.http import models
import base64
import ollama
import requests
import shutil

# Add the current directory to the path so we can import from tools
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tools.embedder import embed_chunks
from tools.chunker import chunk_text
import tools.loader as loader
from Ingestion.clip_embedder import embed_image_clip
from Ingestion.markdown_converter import convert_to_markdown
import re
from tools.loader import is_scanned_pdf

"""
Image and Document Ingestion Pipeline

This module handles ingestion of various file types into the vector database.
- Supports PDF, DOCX, XLSX, CSV, JSON, MD, and image files (PNG, JPG, etc.)
- For images: Generates both OCR text embeddings and CLIP visual embeddings
- Uses 'upsert' operations to ADD new data without deleting existing data
- Preserves all previous data in the vector database
- Converts PDF, DOCX, and PPTX files to Markdown format before ingestion
- Extracts OCR text and CLIP embeddings from images in PDFs
"""

# Ollama configuration
OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_VISION_MODEL = os.environ.get("OLLAMA_VISION_MODEL", "llava")

def describe_image_with_ollama(image_path):
    """Generate a description for an image using Ollama Vision model."""
    print(f"[DEBUG] Sending image to Ollama for description: {image_path}")
    
    try:
        with open(image_path, 'rb') as f:
            response = ollama.chat(
                model=OLLAMA_VISION_MODEL,
                messages=[{
                    'role': 'user',
                    'content': (
                        "You are an expert image analyst. Describe the image in exhaustive detail, covering every visible object, text, layout, "
                        "color, orientation, and structural elements. Mention all identifiable labels, form fields, tables, diagrams, headers, "
                        "footers, checkboxes, logos, icons, or annotations. The description should be structured and suitable for reconstructing or indexing the document."
                        "\n\nDescribe every visible element in this image in full detail."
                    ),
                    'images': [f.read()]
                }],
                options={
                    'temperature': 0.2,
                    'num_ctx': 4096
                }
            )
        
        desc = response.get('message', {}).get('content', '').strip()
        if not desc:
            print(f"[OLLAMA WARNING] No description returned for {image_path}")
            desc = "[NO DESCRIPTION]"
        return desc
        
    except Exception as e:
        print(f"[OLLAMA ERROR] Exception for {image_path}: {e}")
        return "[NO DESCRIPTION]"

# Keep the old function name for backward compatibility
describe_image_with_openai = describe_image_with_ollama

def is_probable_table(text):
    lines = text.split('\n')
    tab_lines = sum('\t' in line for line in lines)
    pipe_lines = sum('|' in line for line in lines)
    table_ratio = (tab_lines + pipe_lines) / max(len(lines), 1)
    return table_ratio > 0.3 or len(lines) > 5 and all(len(line.strip()) == 0 or line.count('|') > 2 for line in lines)

def get_additional_metadata(text, filename, filetype, page_number=None):
    return {
        "file_name": filename,
        "file_type": filetype,
        "word_count": len(text.split()),
        "char_count": len(text),
        "ingested_at": datetime.datetime.now().isoformat(),
        "is_table": is_probable_table(text),
        "page_number": page_number if page_number is not None else -1,
        "source_type": filetype
    }

def load_enriched_json(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    chunks_with_metadata = []
    for page in data.get('pages', []):
        md_text = page.get('md', '')
        if not md_text:
            continue

        metadata = {
            'keywords': page.get('keywords', []),
            'parent_brand': page.get('parent_brand', ''),
            'other_brands': page.get('other_brands', []),
            'dates': page.get('dates', []),
            'serial_nums': page.get('serial_nums', []),
            'part_nums': page.get('part_nums', []),
            'page_title': page.get('page_title', ''),
            'aircraft_names': page.get('aircraft_names', []),
            'source': os.path.basename(filepath)
        }

        chunks_with_metadata.append((md_text, metadata))

    return chunks_with_metadata

def extract_clip_embeddings_from_markdown(markdown_content):
    """
    Extract CLIP embeddings from markdown content that contains CLIP embedding metadata.
    Returns a list of (embedding, metadata) tuples.
    """
    clip_embeddings = []
    
    # Look for CLIP embedding patterns in the markdown
    # Pattern: **[CLIP visual embedding generated - X dimensions]**
    clip_pattern = r'\*\*CLIP Embedding \(Image (\d+)\):\*\*\n\*\[CLIP visual embedding generated - (\d+) dimensions\]\*'
    
    # For now, we'll just note that CLIP embeddings were found
    # In a full implementation, you might want to store the actual embeddings
    # or regenerate them from the image files
    matches = re.findall(clip_pattern, markdown_content)
    
    for match in matches:
        image_num = match[0]
        dimensions = match[1]
        print(f"   🎯 Found CLIP embedding for Image {image_num} ({dimensions} dimensions)")
    
    return clip_embeddings

def chunk_text_with_metadata(text, metadata=None):
    """Simple chunking function that preserves metadata"""
    if metadata is None:
        metadata = {}
    
    chunks = chunk_text(text)
    result = []
    for i, chunk in enumerate(chunks):
        chunk_metadata = metadata.copy()
        chunk_metadata.update({
            'chunk_start': i * len(chunk),
            'chunk_end': (i + 1) * len(chunk),
            'chunk_index': i,
            'is_sub_chunk': len(chunks) > 1
        })
        result.append((chunk, chunk_metadata))
    return result

def load_pdf_with_type_detection(pdf_path):
    if is_scanned_pdf(pdf_path):
        # Scanned: use DOClayout-YOLO
        #return process_with_doclayout_yolo(pdf_path)
        return loader.load_pdf(pdf_path)
    else:
        # Digital: use existing loader
        return loader.load_pdf(pdf_path)

def ingest_folder(folder_path, collection_name="New_Collection", embedding_dim=4096, batch_size=500):
    # Use Qdrant connection info from environment or docker-compose defaults
    qdrant_host = os.environ.get("QDRANT_HOST", "localhost")
    qdrant_port = os.environ.get("QDRANT_PORT", "6333")
    qdrant_url = f"http://{qdrant_host}:{qdrant_port}"
    client = QdrantClient(url=qdrant_url)
    clip_client = QdrantClient(url=qdrant_url)
    clip_collection = "New_Collection_CLIP"
    # Ensure CLIP collection exists
    existing_collections = client.get_collections().collections
    if clip_collection not in [c.name for c in existing_collections]:
        clip_client.create_collection(
            collection_name=clip_collection,
            vectors_config=models.VectorParams(size=embedding_dim, distance=models.Distance.COSINE),
            optimizers_config=models.OptimizersConfigDiff(indexing_threshold=0)
        )

    list_fields = [
        "keywords", "other_brands", "dates", "serial_nums",
        "part_nums", "aircraft_names"
    ]
    single_value_fields = [
        "parent_brand", "page_title", "source", "file_name", "file_type",
        "ingested_at", "page_number", "word_count", "char_count",
        "is_table", "source_type", "document_title", "author", "subject",
        "creator", "producer", "creation_date", "modification_date",
        "total_pages", "page_width", "page_height", "document_type",
        "content_category", "language", "complexity", "chunk_start", "chunk_end",
        "chunk_index", "is_sub_chunk", "paragraph_count", "has_prev_overlap",
        "has_next_overlap", "original_file", "converted_to_markdown", "contains_images",
        "image_ocr_text", "clip_embeddings_found"
    ]

    point_id = 0
    points = []

    for filename in os.listdir(folder_path):
        filepath = os.path.join(folder_path, filename)
        if not os.path.isfile(filepath):
            continue

        ext = os.path.splitext(filename)[1].lower()
        filetype = ext.replace('.', '')
        original_filename = filename
        
        try:
            if ext == ".pdf":
                # --- PAGE-WISE INGESTION WITH IMAGE PLACEHOLDERS ---
                pdf_base = os.path.splitext(filename)[0]
                image_dir = os.path.join(folder_path, pdf_base)
                if not os.path.exists(image_dir):
                    os.makedirs(image_dir)
                doc = loader.fitz.open(filepath)
                print(f"[DEBUG] PDF '{filename}' has {len(doc)} pages.")
                for page_num in range(len(doc)):
                    page = doc[page_num]
                    print(f"[DEBUG] Processing page {page_num+1} of '{filename}'")
                    text = page.get_text().strip()
                    images = page.get_images(full=True)
                    print(f"[DEBUG] Found {len(images)} images on page {page_num+1}.")
                    page_content = text
                    image_placeholders = []
                    for img_idx, img in enumerate(images, start=1):
                        xref = img[0]
                        img_base = f"page_{page_num+1}_img_{img_idx}.png"
                        img_path = os.path.join(image_dir, img_base)
                        try:
                            pix = loader.fitz.Pixmap(doc, xref)
                            try:
                                # Handle different colorspaces
                                if pix.n >= 5:  # CMYK or other complex colorspace
                                    pix_converted = loader.fitz.Pixmap(loader.fitz.csRGB, pix)
                                    pix_converted.save(img_path)
                                    pix_converted = None
                                elif pix.colorspace and pix.colorspace.name in ['DeviceGray', 'DeviceRGB']:
                                    pix.save(img_path)
                                else:
                                    # Convert to RGB for unsupported colorspaces
                                    pix_rgb = loader.fitz.Pixmap(loader.fitz.csRGB, pix)
                                    pix_rgb.save(img_path)
                                    pix_rgb = None
                            except Exception as save_error:
                                # Fallback: try saving as JPEG instead of PNG
                                img_base_jpg = f"page_{page_num+1}_img_{img_idx}.jpg"
                                img_path_jpg = os.path.join(image_dir, img_base_jpg)
                                try:
                                    if pix.n >= 5:
                                        pix_converted = loader.fitz.Pixmap(loader.fitz.csRGB, pix)
                                        pix_converted.save(img_path_jpg)
                                        pix_converted = None
                                    else:
                                        pix.save(img_path_jpg)
                                    img_path = img_path_jpg  # Use JPG path instead
                                    img_base = img_base_jpg
                                except Exception as jpg_error:
                                    print(f"[WARNING] Failed to save image as both PNG and JPG: {save_error}, {jpg_error}")
                                    raise save_error
                            finally:
                                pix = None
                            # Generate description
                            description = describe_image_with_openai(img_path)
                            placeholder = f"{{Image_{img_idx} {os.path.join(pdf_base, img_base)} description: {description}}}"
                            image_placeholders.append((img_idx, placeholder, img_path))
                        except Exception as e:
                            print(f"[WARNING] Failed to extract/save image {img_idx} on page {page_num+1} of {filename}: {e}")
                            continue
                    # Insert image placeholders in text (append at end if not found)
                    for img_idx, placeholder, _ in image_placeholders:
                        page_content += f"\n{placeholder}"
                    # Ingest text (with image placeholders)
                    metadata = get_additional_metadata(page_content, filename, filetype, page_number=page_num+1)
                    metadata['source'] = f"{filename} - Page {page_num+1}"
                    metadata['title'] = metadata['source']
                    try:
                        embedding = embed_chunks(page_content)
                    except Exception as e:
                        print(f"[ERROR] Embedding failed: {e}")
                        continue
                    payload = {"text": page_content}
                    payload.update(metadata)
                    for field in list_fields:
                        if field in payload and not isinstance(payload[field], list):
                            payload[field] = [payload[field]] if payload[field] else []
                    points.append(models.PointStruct(id=point_id, vector=embedding, payload=payload))
                    point_id += 1
                    if len(points) >= batch_size:
                        client.upsert(collection_name=collection_name, points=points)
                        print(f"Upserted {len(points)} points to Qdrant.")
                        points = []
                    # Ingest CLIP embedding for each image in separate collection
                    for img_idx, _, img_path in image_placeholders:
                        try:
                            clip_embedding = embed_image_clip(img_path)
                            clip_metadata = metadata.copy()
                            clip_metadata.update({
                                "vector_type": "clip",
                                "image_file": os.path.basename(img_path),
                                "image_path": img_path,
                                "content_type": "image",
                                "page_number": page_num+1,
                                "image_index": img_idx
                            })
                            clip_client.upsert(collection_name=clip_collection, points=[models.PointStruct(
                                id=point_id, vector=clip_embedding, payload=clip_metadata
                            )])
                            point_id += 1
                        except Exception as e:
                            print(f"[WARNING] CLIP embedding failed for {img_path}: {e}")
                continue  # Skip rest of loop for PDFs
            elif ext == ".json":
                if "_enriched.json" in filename:
                    chunks_with_metadata = load_enriched_json(filepath)
                    # Handle sub-chunking for large enriched JSON chunks
                    processed_chunks = []
                    for text, metadata in chunks_with_metadata:
                        if len(text) > 15000:  # Large chunk threshold
                            sub_chunks = chunk_text_with_metadata(text, metadata=metadata)
                            processed_chunks.extend(sub_chunks)
                        else:
                            # Add chunk metadata
                            chunk_metadata = metadata.copy()
                            chunk_metadata.update({
                                'chunk_start': 0,
                                'chunk_end': len(text),
                                'chunk_index': 0,
                                'is_sub_chunk': False
                            })
                            processed_chunks.append((text, chunk_metadata))
                    chunks_with_metadata = processed_chunks
                else:
                    chunks_with_metadata = loader.load_json(filepath)
            elif ext == ".pdf":
                page_data = load_pdf_with_type_detection(filepath)
                chunks_with_metadata = []
                
                for text, page_metadata in page_data:
                    # If page is too large, sub-chunk it while preserving page metadata
                    if len(text) > 15000:  # Large page threshold
                        sub_chunks = chunk_text_with_metadata(text, metadata=page_metadata)
                        chunks_with_metadata.extend(sub_chunks)
                    else:
                        # Add chunk metadata to single page
                        chunk_metadata = page_metadata.copy()
                        chunk_metadata.update({
                            'chunk_start': 0,
                            'chunk_end': len(text),
                            'chunk_index': 0,
                            'is_sub_chunk': False
                        })
                        chunks_with_metadata.append((text, chunk_metadata))
            elif ext == ".docx":
                text = loader.load_docx(filepath)
                base_metadata = get_additional_metadata(text, filename, filetype)
                chunks_with_metadata = chunk_text_with_metadata(text, metadata=base_metadata)
            elif ext in [".xlsx", ".xls"]:
                text = loader.load_excel(filepath)
                base_metadata = get_additional_metadata(text, filename, filetype)
                chunks_with_metadata = chunk_text_with_metadata(text, metadata=base_metadata)
            elif ext == ".csv":
                text = loader.load_csv(filepath)
                base_metadata = get_additional_metadata(text, filename, filetype)
                chunks_with_metadata = chunk_text_with_metadata(text, metadata=base_metadata)
            elif ext in [".png", ".jpg", ".jpeg", ".bmp", ".tiff"]:
                # 1. OCR text embedding (as before)
                text = loader.load_image(filepath)
                base_metadata = get_additional_metadata(text, filename, filetype)
                chunks_with_metadata = chunk_text_with_metadata(text, metadata=base_metadata)
                
                # 2. Enhanced CLIP image embedding with OCR text
                try:
                    clip_embedding = embed_image_clip(filepath)
                    
                    # Extract OCR text for the CLIP payload
                    ocr_text = text if text.strip() else "No OCR text available"
                    
                    clip_metadata = base_metadata.copy()
                    clip_metadata.update({
                        "vector_type": "clip",
                        "text": f"Image: {filename}\nOCR Text: {ocr_text[:500]}...",  # Include OCR text in payload
                        "ocr_text": ocr_text,
                        "image_file": filename,
                        "image_path": filepath,
                        "content_type": "image",
                        "has_ocr": bool(ocr_text.strip() and ocr_text != "No OCR text available")
                    })
                    
                    # Add CLIP embedding as a separate point
                    points.append(models.PointStruct(
                        id=point_id, 
                        vector=clip_embedding, 
                        payload=clip_metadata
                    ))
                    point_id += 1
                    print(f"Added enhanced CLIP embedding for {filename} with OCR text")
                except Exception as e:
                    print(f"[WARNING] CLIP embedding failed for {filename}: {e}")
                
                # Continue with OCR chunks as before
                for text, metadata in chunks_with_metadata:
                    print("DEBUG METADATA TYPE:", type(metadata), metadata)
                    try:
                        embedding = embed_chunks(text)
                    except Exception as e:
                        print(f"[ERROR] OCR embedding failed: {e}")
                        continue

                    payload = {"text": text, "vector_type": "ocr"}
                    payload.update(metadata)
                    print("DEBUG PAYLOAD:", json.dumps(payload, indent=2, ensure_ascii=False))

                    for field in list_fields:
                        if field in payload and not isinstance(payload[field], list):
                            payload[field] = [payload[field]] if payload[field] else []

                    points.append(models.PointStruct(id=point_id, vector=embedding, payload=payload))
                    point_id += 1

                    if len(points) >= batch_size:
                        client.upsert(collection_name=collection_name, points=points)
                        print(f"Upserted {len(points)} points to Qdrant.")
                        points = []
                
                # Skip the general processing loop for images since we handled them above
                continue
            elif ext == ".md":
                text = loader.load_markdown_file(filepath)
                base_metadata = get_additional_metadata(text, filename, filetype)
                chunks_with_metadata = chunk_text_with_metadata(text, metadata=base_metadata)
            else:
                print(f"[WARNING] Unsupported file type {ext}, skipping.")
                continue
        except Exception as e:
            print(f"[ERROR] Failed to process {filename}: {e}")
            continue

        for text, metadata in chunks_with_metadata:
            print("DEBUG METADATA TYPE:", type(metadata), metadata)
            try:
                embedding = embed_chunks(text)
            except Exception as e:
                print(f"[ERROR] Embedding failed: {e}")
                continue

            payload = {"text": text}
            payload.update(metadata)
            print("DEBUG PAYLOAD:", json.dumps(payload, indent=2, ensure_ascii=False))
            
            # Add conversion metadata if this was converted from another format
            if original_filename != filename:
                payload.update({
                    "original_file": original_filename,
                    "converted_to_markdown": True
                })
                
                # Check if the markdown contains image-related content
                if "![Image" in text:
                    payload.update({
                        "contains_images": True
                    })
                
                # Check if the markdown contains OCR text from images
                if "**OCR Text from Image" in text:
                    payload.update({
                        "image_ocr_text": True
                    })
                
                # Check if the markdown contains CLIP embedding references
                if "**CLIP Embedding" in text:
                    payload.update({
                        "clip_embeddings_found": True
                    })

            for field in list_fields:
                if field in payload and not isinstance(payload[field], list):
                    payload[field] = [payload[field]] if payload[field] else []

            points.append(models.PointStruct(id=point_id, vector=embedding, payload=payload))
            point_id += 1

            if len(points) >= batch_size:
                client.upsert(collection_name=collection_name, points=points)
                print(f"Upserted {len(points)} points to Qdrant.")
                points = []

        # Clean up temporary markdown file if it was created
        if original_filename != filename and filepath.endswith("_converted.md"):
            try:
                os.remove(filepath)
                print(f"🧹 Cleaned up temporary file: {filepath}")
            except Exception as e:
                print(f"[WARNING] Failed to clean up temporary file {filepath}: {e}")

    if points:
        client.upsert(collection_name=collection_name, points=points)
        print(f"Upserted final {len(points)} points to Qdrant.")

    print(f"✅ Ingestion complete for folder '{folder_path}' into collection '{collection_name}'")

if __name__ == "__main__":
    folder_path = os.path.join(os.path.dirname(__file__), "files")
    destination_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "rag_frontend", "pdf"))
    if not os.path.exists(destination_folder):
        os.makedirs(destination_folder)
    ingest_folder(folder_path)
    # Move files after ingestion
    for filename in os.listdir(folder_path):
        src_file = os.path.join(folder_path, filename)
        dst_file = os.path.join(destination_folder, filename)
        if os.path.isfile(src_file):
            shutil.move(src_file, dst_file)
    print(f"Moved ingested files from {folder_path} to {destination_folder}")
