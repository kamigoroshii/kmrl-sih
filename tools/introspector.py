import datetime
import json
import os

import numpy as np

LOG_DIR = "retrieval_logs"
os.makedirs(LOG_DIR, exist_ok=True)

class AgenticIntrospector:
    def __init__(self):
        self.logs = []

    def log_query(self, query, embedding, results, keyword_hits, strategy):
        log = {
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "query": query,
            "embedding_norm": float(np.linalg.norm(embedding)),
            "retrieved_docs": len(results),
            "top_snippet": results[0][0] if results else None,
            "keyword_match_count": keyword_hits,
            "retrieval_strategy": strategy,
            "retrieval_success": len(results) > 0 and keyword_hits > 0,
        }
        self.logs.append(log)

    def save_logs(self):
        if not self.logs:
            return
        timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filepath = os.path.join(LOG_DIR, f"introspection_{timestamp}.json")
        with open(filepath, "w") as f:
            json.dump(self.logs, f, indent=2)
        self.logs = []

    def generate_report(self):
        report = {
            "total_queries": len(self.logs),
            "failures": [log for log in self.logs if not log["retrieval_success"]],
            "strategies_used": list(set(log["retrieval_strategy"] for log in self.logs)),
        }
        return report
