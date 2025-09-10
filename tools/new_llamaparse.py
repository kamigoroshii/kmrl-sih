"""
new_llamaparse.py
─────────────────────
A script to process PDFs using the LlamaParse API and get raw JSON output.
Also enriches the JSON with keywords extracted using Ollama.
"""

import os
import json
import time
import base64
from pathlib import Path
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from tqdm import tqdm
import ollama
from datetime import datetime

# API Configuration
API_BASE = "https://api.cloud.llamaindex.ai/api/v1/parsing"
LLAMA_KEY = "llx-CDJUdNm9eRcXs1euycShKYC8heop9iEYwLXwTE4SPQntwOv4"

if not LLAMA_KEY:
    raise ValueError("LLAMA_CLOUD_API_KEY environment variable not set")

def _headers() -> dict:
    """Get the headers for API requests."""
    return {"Authorization": f"Bearer {LLAMA_KEY}"}

def extract_keywords(md_text: str) -> list:
    """
    Extract aviation-related keywords from markdown text using Ollama.
    Processes text in chunks and returns a deduplicated list of keywords.
    """
    if not md_text or len(md_text.split()) <= 10:
        return []

    try:
        # Split text into chunks of approximately 2000 characters
        chunks = []
        current_chunk = []
        current_length = 0
        
        for line in md_text.split('\n'):
            line_length = len(line)
            if current_length + line_length > 2000:
                chunks.append('\n'.join(current_chunk))
                current_chunk = [line]
                current_length = line_length
            else:
                current_chunk.append(line)
                current_length += line_length
        
        if current_chunk:
            chunks.append('\n'.join(current_chunk))

        all_keywords = []
        for chunk in chunks:
            # Using Ollama instead of OpenAI
            response = ollama.chat(
                model="llama2",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Extract ONLY aviation-related keywords and key phrases from the text, "
                            "focusing on aircraft parts, components, systems, and technical terms. "
                            "Include terms that provide context about aircraft functionality and structure. "
                            "Return ONLY a comma-separated list of relevant aviation terms."
                        ),
                    },
                    {"role": "user", "content": chunk},
                ]
            )

            raw = response["message"]["content"].strip()
            # Split on commas and newlines
            parts = [p.strip() for line in raw.splitlines() for p in line.split(",")]
            all_keywords.extend(parts)

        # Deduplicate keywords
        seen, keywords = set(), []
        for kw in all_keywords:
            kw_clean = kw.strip(" .,:;!?()[]{}\"'").strip()
            low = kw_clean.lower()
            if kw_clean and low not in seen:
                seen.add(low)
                keywords.append(kw_clean)
        
        return keywords
    except Exception as e:
        print(f"[keyword-extraction error] {str(e)}")
        return []

def ensure_dirs():
    """Create necessary directories if they don't exist."""
    for d in ("pdf", "json", "markdown", "images"):
        Path(d).mkdir(exist_ok=True)

def create_session():
    """Create a requests session with retry logic."""
    session = requests.Session()
    retries = Retry(
        total=10,  # increased number of retries
        backoff_factor=2,  # increased backoff time
        status_forcelist=[429, 500, 502, 503, 504],  # added 429 (too many requests)
        allowed_methods=["GET", "POST"],
        respect_retry_after_header=True
    )
    session.mount("https://", HTTPAdapter(max_retries=retries))
    return session

def upload_pdf(pdf_path: Path) -> str:
    """Upload a PDF to LlamaParse API and return the job ID."""
    data = {
        "result_type": "json",          # Changed to json to get layout info
        "extract_layout": True,
        "extract_coordinates": True,
        "extract_text": True,
        "include_markdown": True,
        "use_premium": True
    }
    
    session = create_session()
    with pdf_path.open("rb") as f:
        response = session.post(
            f"{API_BASE}/upload",
            headers=_headers(),
            data=data,
            files={"file": (pdf_path.name, f)},
            timeout=300
        )
    
    if response.status_code != 200:
        raise RuntimeError(f"Upload failed {response.status_code}: {response.text[:400]}")
    
    return response.json().get("job_id") or response.json().get("id")

def wait_for_job(job_id: str, poll_interval: int = 3) -> None:
    """Wait for the parsing job to complete."""
    session = create_session()
    start_time = time.time()
    with tqdm(desc="Parsing", unit="poll") as bar:
        while True:
            try:
                response = session.get(
                    f"{API_BASE}/job/{job_id}",
                    headers=_headers()
                )
                response.raise_for_status()
                
                status = response.json().get("status", "").upper()
                if status in {"SUCCESS", "PARTIAL_SUCCESS"}:
                    elapsed = time.time() - start_time
                    print(f"✓ Parsing completed in {elapsed:.1f} seconds")
                    return
                if status in {"ERROR", "CANCELLED"}:
                    raise RuntimeError(f"Job failed: {response.text}")
                
                bar.update(1)
                time.sleep(poll_interval)
            except requests.exceptions.RequestException as e:
                print(f"[retry] Connection error: {e}")
                time.sleep(poll_interval * 2)  # wait longer on error
                continue

def fetch_json(job_id: str) -> dict:
    """Fetch the raw JSON result from the API."""
    session = create_session()
    max_attempts = 3  # number of complete attempts
    attempt = 0
    
    # List of endpoints to try in order
    endpoints = [
        f"{API_BASE}/job/{job_id}/result/json",  # Try standard endpoint first
        f"{API_BASE}/job/{job_id}/result/raw/json"  # Fallback to raw endpoint
    ]
    
    while attempt < max_attempts:
        for endpoint in endpoints:
            try:
                print(f"Trying endpoint: {endpoint.split('/')[-1]}")
                response = session.get(
                    endpoint,
                    headers=_headers(),
                    timeout=300
                )
                
                if response.status_code == 200:
                    return response.json()
                
                if response.status_code < 500:  # If it's a client error (4xx)
                    print(f"Endpoint {endpoint.split('/')[-1]} returned {response.status_code}")
                    continue  # Try next endpoint
                
            except requests.exceptions.RequestException as e:
                print(f"Error with {endpoint.split('/')[-1]}: {str(e)}")
                continue  # Try next endpoint
        
        # If we get here, all endpoints failed
        attempt += 1
        if attempt < max_attempts:
            wait_time = 20 * attempt  # Increase wait time between attempts
            print(f"[retry] All endpoints failed. Waiting {wait_time}s before attempt {attempt + 1}/{max_attempts}")
            time.sleep(wait_time)
            continue
    
    raise RuntimeError(f"Failed to fetch JSON after {max_attempts} attempts with all endpoints")

def fetch_markdown(job_id: str) -> str:
    """Fetch the markdown result from the API."""
    session = create_session()
    try:
        response = session.get(
            f"{API_BASE}/job/{job_id}/result/raw/markdown",
            headers=_headers(),
            timeout=300
        )
        
        if response.status_code == 200:
            return response.text
        
        # Try alternative endpoint if first one fails
        response = session.get(
            f"{API_BASE}/job/{job_id}/result/markdown",
            headers=_headers(),
            timeout=300
        )
        
        if response.status_code == 200:
            return response.text
        
        raise RuntimeError(f"Could not fetch markdown result: {response.status_code}")
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Failed to fetch markdown: {e}")

def download_image(job_id: str, image_name: str, dst_dir: Path) -> Path:
    """Download a single image from the API."""
    dst_dir.mkdir(parents=True, exist_ok=True)
    fp = dst_dir / image_name
    
    if fp.exists():
        return fp
        
    session = create_session()
    response = session.get(
        f"{API_BASE}/job/{job_id}/result/image/{image_name}",
        headers=_headers(),
        timeout=300
    )
    response.raise_for_status()
    fp.write_bytes(response.content)
    return fp

def enrich_json_with_keywords(json_data: dict) -> dict:
    """Add keywords to each page in the JSON data."""
    for page in json_data.get("pages", []):
        md_content = page.get("md", "")
        if md_content:
            keywords = extract_keywords(md_content)
            page["keywords"] = keywords
    return json_data

def get_image_list(job_id: str) -> list:
    """Get the list of available images from the API."""
    session = create_session()
    response = session.get(
        f"{API_BASE}/job/{job_id}/result/images",
        headers=_headers(),
        timeout=300
    )
    response.raise_for_status()
    return response.json()

def cleanup_old_json(base_name: str) -> None:
    """Remove the old JSON file after new one is saved."""
    old_json = Path("json") / f"{base_name}.json"
    if old_json.exists():
        try:
            old_json.unlink()
            print(f"🗑️  Removed old JSON file: {old_json}")
        except Exception as e:
            print(f"⚠️  Failed to remove old JSON file: {e}")

def process_pdf(pdf_path: Path) -> None:
    """Process a single PDF file and save raw JSON output with keywords."""
    start_time = time.time()
    base_name = pdf_path.stem
    print(f"\n⏫ Processing {pdf_path.name}")
    
    try:
        # Upload and get job ID
        print("📤 Uploading PDF...")
        upload_start = time.time()
        job_id = upload_pdf(pdf_path)
        print(f"🪄 Job ID: {job_id} (upload took {time.time() - upload_start:.1f}s)")
        
        # Wait for processing to complete
        wait_for_job(job_id)
        
        # 1. First get and save markdown
        print("📥 Fetching markdown...")
        md_start = time.time()
        md_content = fetch_markdown(job_id)
        md_path = Path("markdown") / f"{base_name}.md"
        md_path.write_text(md_content, encoding="utf-8")
        print(f"📝 Markdown saved → {md_path} (took {time.time() - md_start:.1f}s)")
        
        # 2. Get JSON first
        print("📊 Fetching JSON data...")
        json_start = time.time()
        try:
            json_content = fetch_json(job_id)
            print(f"✓ JSON fetched (took {time.time() - json_start:.1f}s)")
            
            # Save raw JSON first
            json_path = Path("json") / f"{base_name}.json"
            json_path.write_text(json.dumps(json_content, indent=2), encoding="utf-8")
            print(f"📄 Raw JSON saved → {json_path}")
        except Exception as e:
            print(f"❌ Failed to fetch JSON: {e}")
            print("Skipping image processing and keyword extraction...")
            return
        
        # 3. Process images from JSON
        print("🖼️  Processing images...")
        images_dir = Path("images") / base_name
        images_dir.mkdir(parents=True, exist_ok=True)
        
        # Collect image names from JSON
        image_names = set()
        for page in json_content.get("pages", []):
            # Add images from layout
            for item in page.get("layout", []):
                if "image" in item and item["image"]:
                    image_names.add(item["image"])
            # Add images from page images
            for img in page.get("images", []):
                if isinstance(img, dict) and "name" in img and img["name"]:
                    image_names.add(img["name"])
        
        if not image_names:
            print("ℹ️  No images found in document")
        else:
            print(f"📥 Found {len(image_names)} images")
            total_images = 0
            img_start = time.time()
            
            for img_name in tqdm(image_names, desc="Downloading images"):
                try:
                    session = create_session()
                    response = session.get(
                        f"{API_BASE}/job/{job_id}/result/image/{img_name}",
                        headers=_headers(),
                        timeout=300
                    )
                    if response.status_code == 200:
                        img_path = images_dir / img_name
                        img_path.write_bytes(response.content)
                        total_images += 1
                except Exception as e:
                    print(f"[image-save error] Failed to save image {img_name}: {e}")
            
            if total_images > 0:
                print(f"📸 Saved {total_images} images → {images_dir} (took {time.time() - img_start:.1f}s)")
        
        # 4. Enrich JSON with keywords
        print("🔍 Extracting keywords...")
        kw_start = time.time()
        enriched_json = enrich_json_with_keywords(json_content)
        print(f"✓ Keywords extracted (took {time.time() - kw_start:.1f}s)")
        
        # Save enriched JSON
        enriched_json_path = Path("json") / f"{base_name}_enriched.json"
        enriched_json_path.write_text(json.dumps(enriched_json, indent=2), encoding="utf-8")
        print(f"📄 Enriched JSON saved → {enriched_json_path}")
        
        # Clean up old JSON
        cleanup_old_json(base_name)
        
        # Print preview of first page
        if enriched_json.get("pages"):
            first_page = enriched_json["pages"][0]
            print("\nJSON preview (first page):")
            print(json.dumps(first_page, indent=2)[:400])
        
        total_time = time.time() - start_time
        print(f"\n✨ Processing completed in {time.time() - start_time:.1f} seconds")
            
    except Exception as e:
        print(f"❌ Failed to process {pdf_path.name}: {e}")
        raise

def main():
    """Main function to process all PDFs in the pdf directory."""
    ensure_dirs()
    
    pdf_files = list(Path("pdf").glob("*.pdf"))
    if not pdf_files:
        print("❌ No PDF files found in ./pdf")
        return
    
    print(f"\n📚 Found {len(pdf_files)} PDFs")
    total_start = time.time()
    
    for pdf in pdf_files:
        try:
            process_pdf(pdf)
        except Exception as e:
            print(f"❌ Failed to process {pdf.name}: {e}")
    
    total_time = time.time() - total_start
    print(f"\n✨ All done! Total time: {total_time:.1f} seconds")

if __name__ == "__main__":
    main() 