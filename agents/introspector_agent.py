from tools.introspector import AgenticIntrospector

class IntrospectorAgent:
    def __init__(self):
        self.introspector = AgenticIntrospector()

    def log(self, query, query_emb, semantic_results, keyword_hits, retrieval_mode):
        self.introspector.log_query(query, query_emb, semantic_results, keyword_hits, retrieval_mode)
        self.introspector.save_logs()

    def report(self):
        return self.introspector.generate_report()
