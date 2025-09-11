
from qdrant_client import QdrantClient
from qdrant_client.http import models

# Connect to Qdrant
client = QdrantClient("http://localhost:6333")

# Create main collection with 4096 vector dimensions (for text embeddings)
client.create_collection(
    collection_name="New_Collection",
    vectors_config=models.VectorParams(size=4096, distance=models.Distance.COSINE)
)

# Create CLIP collection with 1536 vector dimensions (for image embeddings)
client.create_collection(
    collection_name="New_Collection_CLIP",
    vectors_config=models.VectorParams(size=1536, distance=models.Distance.COSINE)
)

print("Collections created:")
print("- 'New_Collection' with 4096 dimensions for text embeddings")
print("- 'New_Collection_CLIP' with 1536 dimensions for image embeddings")
