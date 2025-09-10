def chunk_text(text, chunk_size=15000, overlap=1000, metadata=None):
    """
    Chunk text while preserving metadata.
    Returns list of (chunk_text, chunk_metadata) tuples.
    """
    chunks = []
    for i in range(0, len(text), chunk_size - overlap):
        chunk_text = text[i:i+chunk_size]
        chunk_metadata = metadata.copy() if metadata else {}
        
        # Add chunk-specific metadata
        chunk_metadata.update({
            'chunk_start': i,
            'chunk_end': min(i + chunk_size, len(text)),
            'chunk_index': len(chunks),
            'is_sub_chunk': len(text) > chunk_size
        })
        
        chunks.append((chunk_text, chunk_metadata))
    return chunks

def chunk_pdf_pages_with_paragraph_overlap(page_texts, page_metadata_list=None):
    """
    Given list of PDF page texts and their metadata, return list of chunks with 1-paragraph overlap.
    Returns list of (chunk_text, chunk_metadata) tuples.
    """
    chunks = []
    
    for i, text in enumerate(page_texts):
        # Get metadata for this page
        page_metadata = page_metadata_list[i] if page_metadata_list and i < len(page_metadata_list) else {}
        
        current_paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]

        prev_para = ""
        if i > 0:
            prev_paragraphs = [p.strip() for p in page_texts[i - 1].split('\n\n') if p.strip()]
            if prev_paragraphs:
                prev_para = prev_paragraphs[-1]

        next_para = ""
        if i < len(page_texts) - 1:
            next_paragraphs = [p.strip() for p in page_texts[i + 1].split('\n\n') if p.strip()]
            if next_paragraphs:
                next_para = next_paragraphs[0]

        full_chunk = "\n\n".join([prev_para] + current_paragraphs + [next_para])
        
        # Create chunk metadata preserving page information
        chunk_metadata = page_metadata.copy()
        chunk_metadata.update({
            'chunk_index': len(chunks),
            'is_sub_chunk': False,
            'paragraph_count': len(current_paragraphs),
            'has_prev_overlap': bool(prev_para),
            'has_next_overlap': bool(next_para)
        })
        
        chunks.append((full_chunk, chunk_metadata))

    return chunks

def chunk_text_with_metadata(text, chunk_size=15000, overlap=1000, metadata=None):
    """
    Chunk text while preserving all metadata including page numbers.
    This is the main function to use for chunking any text with metadata.
    Always adds a 'title' to metadata (file_name + page_number if available), and 'image_url' if present.
    """
    if not metadata:
        metadata = {}
    # Add title if not present
    if 'title' not in metadata:
        file_name = metadata.get('file_name', '')
        page_number = metadata.get('page_number', None)
        if file_name and page_number and page_number != -1:
            metadata['title'] = f"{file_name} - Page {page_number}"
        elif file_name:
            metadata['title'] = file_name
        else:
            metadata['title'] = 'Document Chunk'
    # If image_url is present in metadata, keep it
    # If text is small enough, return as single chunk
    if len(text) <= chunk_size:
        chunk_metadata = metadata.copy()
        chunk_metadata.update({
            'chunk_start': 0,
            'chunk_end': len(text),
            'chunk_index': 0,
            'is_sub_chunk': False
        })
        return [(text, chunk_metadata)]
    # Otherwise, create multiple chunks
    return chunk_text(text, chunk_size, overlap, metadata)

