from qdrant_client import QdrantClient
from qdrant_client.http import models
import numpy as np
import time
from qdrant_client.http.exceptions import ResponseHandlingException

class Retriever:
    def __init__(self, collection_name="New_Collection", embedding_dim=4096):
        # Retry logic for Qdrant connection
        for attempt in range(10):
            try:
                self.client = QdrantClient(url="http://localhost:6333")
                self.collection_name = collection_name
                self.embedding_dim = embedding_dim
                self.clip_collection_name = "New_Collection_CLIP"
                self.clip_embedding_dim = 1536  # Correct CLIP embedding dimension
                
                # Check and create collections if they don't exist
                existing_collections = self.client.get_collections().collections
                if self.collection_name not in [c.name for c in existing_collections]:
                    self.client.create_collection(
                        collection_name=self.collection_name,
                        vectors_config=models.VectorParams(size=self.embedding_dim, distance=models.Distance.COSINE)
                    )
                
                if self.clip_collection_name not in [c.name for c in existing_collections]:
                    self.client.create_collection(
                        collection_name=self.clip_collection_name,
                        vectors_config=models.VectorParams(size=self.clip_embedding_dim, distance=models.Distance.COSINE)
                    )
                break
            except ResponseHandlingException as e:
                print(f"Qdrant not ready, retrying in 5s... ({attempt+1}/10)")
                time.sleep(5)
        else:
            raise RuntimeError("Qdrant is not available after 10 attempts")

    def add_documents(self, chunks, embeddings, source, metadatas=None):
        points = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            point_id = f"{source}_{i}"
            payload = {
                "text": chunk,
                "source": source
            }

            if metadatas and i < len(metadatas):
                payload.update(metadatas[i])

            points.append(
                models.PointStruct(
                    id=point_id,
                    vector=embedding,
                    payload=payload
                )
            )

        self.client.upsert(collection_name=self.collection_name, points=points)

    def search(self, query_embedding, top_k=5, filters=None, search_both_collections=True):
        """
        Search for similar documents. Can search both OCR and CLIP collections.
        
        Args:
            query_embedding: The query embedding vector
            top_k: Number of results to return
            filters: Optional filters to apply
            search_both_collections: If True, search both OCR and CLIP collections
        """
        if search_both_collections:
            return self.search_both_collections(query_embedding, top_k, filters)
        else:
            return self.search_single_collection(query_embedding, top_k, filters, self.collection_name)

    def search_single_collection(self, query_embedding, top_k=5, filters=None, collection_name=None):
        """Search in a single collection."""
        if collection_name is None:
            collection_name = self.collection_name
            
        query_vector = query_embedding if isinstance(query_embedding, list) else query_embedding.tolist()

        search_filter = None
        if filters:
            conditions = [
                models.FieldCondition(
                    key=key,
                    match=models.MatchValue(value=value)
                ) for key, value in filters.items()
            ]
            search_filter = models.Filter(must=list(conditions))

        try:
            hits = self.client.search(
                collection_name=collection_name,
                query_vector=query_vector,
                limit=top_k,
                with_payload=True,
                query_filter=search_filter
            )

            results = []
            for hit in hits:
                payload = hit.payload or {}
                text = payload.get("text", "")
                source = payload.get("source", "")
                score = hit.score
                vector_type = payload.get("vector_type", "ocr")
                results.append((text, source, score, vector_type))
            return results
        except Exception as e:
            print(f"Error searching collection {collection_name}: {e}")
            return []

    def search_both_collections(self, query_embedding, top_k=5, filters=None):
        """
        Search both OCR and CLIP collections and combine results.
        
        Args:
            query_embedding: The query embedding vector
            top_k: Number of results to return per collection
            filters: Optional filters to apply
        """
        query_vector = query_embedding if isinstance(query_embedding, list) else query_embedding.tolist()
        
        ocr_results = []
        clip_results = []
        
        # Search OCR collection (text embeddings) - only if query is 1536-dimensional
        if len(query_vector) == self.embedding_dim:
            ocr_results = self.search_single_collection(query_embedding, top_k, filters, self.collection_name)
        elif len(query_vector) == self.clip_embedding_dim:
            # If query is 1536-dimensional, only search CLIP collection
            clip_results = self.search_single_collection(query_embedding, top_k, filters, self.clip_collection_name)
        else:
            print(f"Warning: Query embedding dimension {len(query_vector)} doesn't match either OCR ({self.embedding_dim}) or CLIP ({self.clip_embedding_dim}) dimensions")
            # Try OCR collection anyway as fallback
            try:
                ocr_results = self.search_single_collection(query_embedding, top_k, filters, self.collection_name)
            except:
                pass
        
        # Combine and sort by score
        all_results = ocr_results + clip_results
        all_results.sort(key=lambda x: x[2], reverse=True)  # Sort by score
        
        # Return top_k overall results
        return all_results[:top_k]

    def get_all_chunks(self):
        scroll = self.client.scroll(
            collection_name=self.collection_name,
            limit=10000,
            with_payload=True
        )

        results = []
        for point in scroll[0]:
            payload = point.payload or {}
            text = payload.get("text", "")
            source = payload.get("source", "")
            results.append((text, source))
        return results

    def get_all_titles(self):
        scroll = self.client.scroll(
            collection_name=self.collection_name,
            limit=10000,
            with_payload=True
        )

        titles = set()
        for point in scroll[0]:
            payload = point.payload or {}
            title = payload.get("title") or payload.get("source")
            if title:
                titles.add(title)
        return list(titles)
