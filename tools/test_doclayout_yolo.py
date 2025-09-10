import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from tools.doclayout_yolo_wrapper import process_with_doclayout_yolo

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python tools/test_doclayout_yolo.py <path_to_scanned_pdf>")
        sys.exit(1)
    pdf_path = sys.argv[1]
    print(f"Processing: {pdf_path}")
    chunks = process_with_doclayout_yolo(pdf_path)
    for i, (text, metadata) in enumerate(chunks):
        print(f"\n--- Chunk {i+1} ---")
        print("Text:")
        print(text)
        print("Metadata:")
        print(metadata) 