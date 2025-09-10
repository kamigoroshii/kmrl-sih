import torch
import clip
from PIL import Image
import torch.nn as nn

# Load CLIP model and preprocessing only once
_device = "cuda" if torch.cuda.is_available() else "cpu"
_clip_model, _preprocess = clip.load("ViT-B/32", device=_device)

# Create projection layer to convert 512-dim to 1536-dim
_projection_layer = nn.Linear(512, 1536).to(_device)

def embed_image_clip(image_path):
    """Embed image using CLIP and project to 1536 dimensions"""
    image = _preprocess(Image.open(image_path)).unsqueeze(0).to(_device)
    with torch.no_grad():
        # Get 512-dim CLIP embedding
        image_features = _clip_model.encode_image(image)
        # Project to 1536 dimensions
        projected_features = _projection_layer(image_features)
        # Normalize the projected features
        projected_features = torch.nn.functional.normalize(projected_features, p=2, dim=1)
    return projected_features.cpu().numpy().flatten().tolist()

def embed_text_clip(text):
    """Embed text using CLIP and project to 1536 dimensions"""
    text_tokens = clip.tokenize([text]).to(_device)
    with torch.no_grad():
        # Get 512-dim CLIP embedding
        text_features = _clip_model.encode_text(text_tokens)
        # Project to 1536 dimensions
        projected_features = _projection_layer(text_features)
        # Normalize the projected features
        projected_features = torch.nn.functional.normalize(projected_features, p=2, dim=1)
    return projected_features.cpu().numpy().flatten().tolist()

def get_clip_dimension():
    """Get the output dimension of the projected CLIP embeddings"""
    return 1536 