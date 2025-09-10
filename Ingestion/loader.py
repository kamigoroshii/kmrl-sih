import fitz
import pytesseract
import pandas as pd
from PIL import Image
import docx
import os
import json
import re
from datetime import datetime
import easyocr

reader = easyocr.Reader(['en'])

def load_markdown_file(file_path):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        print(f"[ERROR] Failed to load markdown file {file_path}: {e}")
        return ""

def load_pdf(file_path):
    doc = fitz.open(file_path)
    chunks = []
    filename = os.path.basename(file_path)
    for page_num, page in enumerate(doc, start=1):
        text = page.get_text().strip()
        if text:
            metadata = {
                "file_name": filename,
                "file_type": "pdf",
                "page_number": page_num,
                "source": f"{filename} - Page {page_num}",
                "title": f"{filename} - Page {page_num}"
            }
            chunks.append((text, metadata))
    return chunks

def load_docx(filepath):
    doc = docx.Document(filepath)
    return "\n".join([p.text for p in doc.paragraphs])

def load_excel(filepath):
    df = pd.read_excel(filepath)
    return df.to_string()

def load_csv(filepath):
    df = pd.read_csv(filepath)
    return df.to_string()

def load_image(filepath):
    # Validate image can be opened
    try:
        img = Image.open(filepath)
        img.verify()  # Will raise an exception if not a valid image
    except Exception as e:
        raise ValueError(f'Invalid image file: {e}')
    result = reader.readtext(filepath, detail=0)
    if isinstance(result, list):
        result = [str(r) for r in result]
        return '\n'.join(result)
    return str(result)


def load_json(file_path):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        chunks = []
        for idx, page in enumerate(data.get("pages", []), start=1):
            texts = []

            # Helper to normalize string or list of strings
            def normalize(value):
                if isinstance(value, list):
                    return "\n".join([str(v).strip() for v in value if isinstance(v, str)])
                elif isinstance(value, str):
                    return value.strip()
                return ""

            # 1. Page-level text
            page_text = normalize(page.get("text", ""))
            if page_text:
                texts.append(page_text)

            # 2. Extracted items
            for item in page.get("items", []):
                val = normalize(item.get("text", ""))
                if val:
                    texts.append(val)

            # 3. OCR text from images
            for img in page.get("images", []):
                ocr_text = normalize(img.get("ocr", ""))
                if ocr_text:
                    texts.append(ocr_text)

            # 4. Optional layout metadata
            layout_labels = []
            for box in page.get("layout", []):
                label = box.get("label")
                raw_text = normalize(box.get("text", ""))
                if label and raw_text:
                    layout_labels.append(f"[{label}] {raw_text}")
            if layout_labels:
                texts.append("\n".join(layout_labels))

            combined = "\n".join(texts).strip()
            if combined:
                chunks.append((combined, f"{os.path.basename(file_path)} - Page {idx}"))

        return chunks

    except Exception as e:
        print(f"[ERROR] Failed to load JSON layout file {file_path}: {e}")
        return []

def load_pdf_with_metadata(file_path):
    """Return a list of (text, metadata) tuples per page from the PDF."""
    doc = fitz.open(file_path)
    page_data = []
    
    # Extract document-level metadata
    doc_metadata = doc.metadata
    filename = os.path.basename(file_path)
    
    # Extract document properties
    title = doc_metadata.get('title', '')
    author = doc_metadata.get('author', '')
    subject = doc_metadata.get('subject', '')
    creator = doc_metadata.get('creator', '')
    producer = doc_metadata.get('producer', '')
    creation_date = doc_metadata.get('creationDate', '')
    mod_date = doc_metadata.get('modDate', '')
    
    # Try to extract title from first page if not in metadata
    if not title and len(doc) > 0:
        first_page = doc[0]
        first_page_text = first_page.get_text().strip()
        # Look for potential title patterns
        lines = first_page_text.split('\n')
        for line in lines[:5]:  # Check first 5 lines
            line = line.strip()
            if line and len(line) > 10 and len(line) < 200:
                # Skip common headers/footers
                if not any(skip in line.lower() for skip in ['page', 'confidential', 'draft', 'internal']):
                    title = line
                    break
    
    for page_num, page in enumerate(doc, 1):
        text = page.get_text().strip()
        
        # Extract page-level metadata
        page_metadata = {
            'file_name': filename,
            'file_type': 'pdf',
            'page_number': page_num,
            'total_pages': len(doc),
            'page_width': page.rect.width,
            'page_height': page.rect.height,
            'word_count': len(text.split()),
            'char_count': len(text),
            'ingested_at': datetime.now().isoformat(),
            'is_table': is_probable_table(text),
            'source_type': 'pdf'
        }
        
        # Add document-level metadata
        if title:
            page_metadata['document_title'] = title
        if author:
            page_metadata['author'] = author
        if subject:
            page_metadata['subject'] = subject
        if creator:
            page_metadata['creator'] = creator
        if producer:
            page_metadata['producer'] = producer
        if creation_date:
            page_metadata['creation_date'] = creation_date
        if mod_date:
            page_metadata['modification_date'] = mod_date
            
        # Extract content-based metadata
        content_metadata = extract_content_metadata(text, filename)
        page_metadata.update(content_metadata)
        
        # Extract document-specific metadata
        doc_metadata = extract_document_specific_metadata(text, filename)
        page_metadata.update(doc_metadata)
        
        # Set source with page number in the format expected by the backend
        page_metadata['source'] = f"{filename} - Page {page_num}"
        page_metadata['title'] = page_metadata['source']
        
        page_data.append((text, page_metadata))
    
    doc.close()
    return page_data

def extract_content_metadata(text, filename):
    """Extract metadata from text content."""
    metadata = {
        'keywords': [],
        'parent_brand': '',
        'other_brands': [],
        'dates': [],
        'serial_nums': [],
        'part_nums': [],
        'page_title': '',
        'aircraft_names': [],
        'source': filename
    }
    
    if not text:
        return metadata
    
    # Extract dates (various formats)
    date_patterns = [
        r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b',  # DD/MM/YYYY or DD-MM-YYYY
        r'\b\d{4}[/-]\d{1,2}[/-]\d{1,2}\b',    # YYYY/MM/DD or YYYY-MM-DD
        r'\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4}\b',  # DD Month YYYY
        r'\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{2,4}\b',  # Month DD, YYYY
        r'\b\d{4}\b'  # Just year
    ]
    
    for pattern in date_patterns:
        dates = re.findall(pattern, text, re.IGNORECASE)
        metadata['dates'].extend(dates)
    
    # Extract serial numbers (common patterns)
    serial_patterns = [
        r'\b[A-Z]{2,4}\d{3,8}\b',  # ABC123456
        r'\b\d{3,8}[A-Z]{2,4}\b',  # 123456ABC
        r'\b[A-Z]{2,4}-\d{3,8}\b',  # ABC-123456
        r'\b\d{3,8}-[A-Z]{2,4}\b',  # 123456-ABC
    ]
    
    for pattern in serial_patterns:
        serials = re.findall(pattern, text)
        metadata['serial_nums'].extend(serials)
    
    # Extract part numbers
    part_patterns = [
        r'\b[A-Z]{2,4}\d{3,8}[A-Z]?\b',  # ABC123456X
        r'\b[A-Z]{2,4}-\d{3,8}[A-Z]?\b',  # ABC-123456X
        r'\b[A-Z]{2,4}\.\d{3,8}[A-Z]?\b',  # ABC.123456X
    ]
    
    for pattern in part_patterns:
        parts = re.findall(pattern, text)
        metadata['part_nums'].extend(parts)
    
    # Extract potential page title (first significant line)
    lines = text.split('\n')
    for line in lines[:3]:  # Check first 3 lines
        line = line.strip()
        if line and len(line) > 5 and len(line) < 200:
            # Skip common headers/footers
            if not any(skip in line.lower() for skip in ['page', 'confidential', 'draft', 'internal', 'total']):
                metadata['page_title'] = line
                break
    
    # Extract potential brands/companies (capitalized words that might be brands)
    brand_patterns = [
        r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Ltd|Limited|Inc|Corp|Corporation|Company|Co|LLC)\b',
        r'\b[A-Z]{2,4}\b',  # Short acronyms like IBM, HP, etc.
    ]
    
    for pattern in brand_patterns:
        brands = re.findall(pattern, text)
        metadata['other_brands'].extend(brands)
    
    # Try to identify parent brand from filename or content
    filename_lower = filename.lower()
    if 'tata' in filename_lower:
        metadata['parent_brand'] = 'Tata'
    elif 'ril' in filename_lower:
        metadata['parent_brand'] = 'RIL'
    elif 'cn' in filename_lower:
        metadata['parent_brand'] = 'Computer Networks'
    elif 'math' in filename_lower:
        metadata['parent_brand'] = 'Mathematics'
    else:
        # Try to find parent brand in content
        parent_brand_patterns = [
            r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Annual|Report|Limited|Ltd|Corporation)\b',
            r'\b([A-Z]{2,4})\s+(?:Annual|Report|Limited|Ltd|Corporation)\b',
        ]
        for pattern in parent_brand_patterns:
            matches = re.findall(pattern, text)
            if matches:
                metadata['parent_brand'] = matches[0]
                break
    
    # Extract aircraft names (common patterns)
    aircraft_patterns = [
        r'\b[A-Z]{2,4}-\d{3,4}\b',  # Boeing 737, Airbus A320
        r'\b[A-Z]{2,4}\s+\d{3,4}\b',  # Boeing 737, Airbus A320
    ]
    
    for pattern in aircraft_patterns:
        aircraft = re.findall(pattern, text)
        metadata['aircraft_names'].extend(aircraft)
    
    # Extract keywords (significant capitalized words and technical terms)
    words = text.split()
    keywords = []
    technical_terms = [
        'network', 'protocol', 'routing', 'subnet', 'firewall', 'encryption',
        'algorithm', 'database', 'server', 'client', 'api', 'framework',
        'financial', 'revenue', 'profit', 'assets', 'liabilities', 'equity',
        'statistics', 'probability', 'distribution', 'hypothesis', 'regression',
        'maintenance', 'reliability', 'engineering', 'manufacturing', 'quality'
    ]
    
    for word in words:
        word_clean = word.strip('.,;:!?()[]{}"\'-').lower()
        if (len(word_clean) > 3 and 
            word_clean in technical_terms):
            keywords.append(word_clean)
        elif (len(word) > 3 and 
              word[0].isupper() and 
              word not in ['The', 'And', 'For', 'With', 'From', 'This', 'That', 'These', 'Those']):
            keywords.append(word)
    
    metadata['keywords'] = keywords[:20]  # Limit to 20 keywords
    
    # Remove duplicates
    for key in ['dates', 'serial_nums', 'part_nums', 'other_brands', 'aircraft_names', 'keywords']:
        metadata[key] = list(set(metadata[key]))
    
    return metadata

def is_probable_table(text):
    """Check if text is likely a table."""
    lines = text.split('\n')
    tab_lines = sum('\t' in line for line in lines)
    pipe_lines = sum('|' in line for line in lines)
    table_ratio = (tab_lines + pipe_lines) / max(len(lines), 1)
    return table_ratio > 0.3 or (len(lines) > 5 and all(len(line.strip()) == 0 or line.count('|') > 2 for line in lines))

def extract_document_specific_metadata(text, filename):
    """Extract document-specific metadata based on content analysis."""
    metadata = {}
    
    # Financial document indicators
    financial_terms = ['revenue', 'profit', 'loss', 'assets', 'liabilities', 'equity', 'balance sheet', 'income statement', 'cash flow']
    if any(term in text.lower() for term in financial_terms):
        metadata['document_type'] = 'financial_report'
        metadata['content_category'] = 'finance'
    
    # Technical document indicators
    technical_terms = ['protocol', 'algorithm', 'network', 'system', 'architecture', 'implementation']
    if any(term in text.lower() for term in technical_terms):
        metadata['document_type'] = 'technical_document'
        metadata['content_category'] = 'technology'
    
    # Academic document indicators
    academic_terms = ['course', 'syllabus', 'curriculum', 'academic', 'university', 'institute']
    if any(term in text.lower() for term in academic_terms):
        metadata['document_type'] = 'academic_document'
        metadata['content_category'] = 'education'
    
    # Extract document language
    # Simple heuristic: count common English words vs other patterns
    english_words = ['the', 'and', 'for', 'with', 'from', 'this', 'that', 'have', 'will', 'are']
    english_count = sum(1 for word in text.lower().split() if word in english_words)
    if english_count > len(text.split()) * 0.1:  # More than 10% are common English words
        metadata['language'] = 'english'
    else:
        metadata['language'] = 'unknown'
    
    # Extract document complexity (based on average word length and sentence length)
    words = text.split()
    if words:
        avg_word_length = sum(len(word) for word in words) / len(words)
        sentences = text.split('.')
        avg_sentence_length = sum(len(s.split()) for s in sentences if s.strip()) / max(len(sentences), 1)
        
        if avg_word_length > 6 or avg_sentence_length > 20:
            metadata['complexity'] = 'high'
        elif avg_word_length > 4 or avg_sentence_length > 15:
            metadata['complexity'] = 'medium'
        else:
            metadata['complexity'] = 'low'
    
    return metadata
