from tools.embedder import embed_query
from tools.retriever import Retriever

class RetrieverAgent:
    def __init__(self, confidence_threshold=0.5, top_k=5):
        self.retriever = Retriever()
        self.threshold = confidence_threshold
        self.top_k = top_k

    def retrieve(self, query: str):
        query_emb = embed_query(query)
        results = self.retriever.search(query_emb, top_k=self.top_k)

        # Filter by confidence
        confident = [(chunk, src, score) for chunk, src, score in results if score >= self.threshold]
        if confident:
            return [(c, s) for c, s, _ in confident], "semantic"

        # Fallback to keyword-based
        keywords = query.lower().split()
        all_chunks = self.retriever.get_all_chunks()

        def score(c): return sum(word in c.lower() for word in keywords)
        fallback = sorted([(chunk, src, score(chunk)) for chunk, src in all_chunks], key=lambda x: x[2], reverse=True)
        top = [(chunk, src) for chunk, src, s in fallback if s > 0][:self.top_k]
        return top, "keyword"
