import fitz  # PyMuPDF
import os
import tempfile
import uuid
from PIL import Image
import easyocr
import numpy as np
from huggingface_hub import hf_hub_download
from doclayout_yolo import YOLOv10

# Directory to save cropped images for frontend access
STATIC_IMAGE_DIR = os.path.join(os.getcwd(), 'static', 'doclayout_crops')
os.makedirs(STATIC_IMAGE_DIR, exist_ok=True)

# Initialize OCR reader once for efficiency
reader = easyocr.Reader(['en'], gpu=False)

# Download the pretrained model if not already present
MODEL_REPO = "juliozhao/DocLayout-YOLO-DocStructBench"
MODEL_FILENAME = "doclayout_yolo_docstructbench_imgsz1024.pt"
MODEL_PATH = hf_hub_download(repo_id=MODEL_REPO, filename=MODEL_FILENAME)

# Load the model once
model = YOLOv10(MODEL_PATH)

def extract_text_from_bbox(image, bbox):
    """
    Crop the image to the bbox and run OCR.
    bbox: [x1, y1, x2, y2]
    """
    cropped = image.crop(bbox)
    cropped_np = np.array(cropped)
    result = reader.readtext(cropped_np, detail=0)
    # Ensure result is a list of strings
    if isinstance(result, list):
        result = [str(r) for r in result if isinstance(r, str)]
    else:
        result = [str(result)]
    return '\n'.join(result), cropped

def process_with_doclayout_yolo(pdf_path):
    doc = fitz.open(pdf_path)
    chunks = []
    file_name = os.path.basename(pdf_path)
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        # Generate a unique temp file name for the image
        img_path = os.path.join(tempfile.gettempdir(), f"doclayout_{uuid.uuid4().hex}.png")
        pix = page.get_pixmap(dpi=300)
        pix.save(img_path)

        # Run DocLayout-YOLO SDK on the image
        det_res = model.predict(img_path, imgsz=1024, conf=0.2, device="cpu")
        with Image.open(img_path) as image:
            detected_classes = [int(cls) for cls in det_res[0].boxes.cls]
            print(f"Page {page_num+1} detected classes: {detected_classes}")
            for idx, (box, cls) in enumerate(zip(det_res[0].boxes.xyxy, det_res[0].boxes.cls)):
                x1, y1, x2, y2 = map(int, box.tolist())
                text, cropped_img = extract_text_from_bbox(image, (x1, y1, x2, y2))
                if text.strip():
                    # Save the cropped image to the static directory
                    crop_filename = f"{file_name}_page{page_num+1}_region{idx+1}.png"
                    crop_path = os.path.join(STATIC_IMAGE_DIR, crop_filename)
                    cropped_img.save(crop_path)
                    # Construct the image URL (adjust if you serve static files differently)
                    image_url = f"/static/doclayout_crops/{crop_filename}"
                    metadata = {
                        'file_name': file_name,
                        'file_type': 'pdf',
                        'page_number': page_num + 1,
                        'layout_label': str(cls),
                        'bbox': [x1, y1, x2, y2],
                        'class_index': int(cls),
                        'image_url': image_url
                    }
                    chunks.append((text, metadata))
        os.remove(img_path)
    return chunks 