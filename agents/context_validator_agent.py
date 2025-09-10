import ollama
import os
from tools.retriever import Retriever

OLLAMA_HOST = os.getenv('OLLAMA_HOST', 'http://localhost:11434')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3.1')

class ContextValidatorAgent:
    def __init__(self):
        self.retriever = Retriever()
    
    def get_available_topics(self) -> list[str]:
        """
        Get a list of available topics from the documents to suggest alternatives.
        """
        try:
            all_chunks = self.retriever.get_all_chunks()
            if not all_chunks:
                return []
            
            # Sample chunks to extract topics
            sample_chunks = all_chunks[:20]  # First 20 chunks
            
            # Extract potential topics using LLM
            chunk_texts = [chunk[:200] for chunk, _ in sample_chunks]  # First 200 chars of each
            combined_text = "\n".join(chunk_texts)
            
            prompt = f"""
            Based on the following document samples, identify 5-8 main topics or categories that are covered.
            Return only a JSON array of topic strings, no explanations.
            
            Document samples:
            {combined_text}
            """
            
            response = ollama.chat(
                model=OLLAMA_MODEL,
                messages=[
                    {"role": "system", "content": "You are an expert at identifying main topics from document content."},
                    {"role": "user", "content": prompt}
                ],
                options={
                    "temperature": 0.3,
                    "num_ctx": 4096
                }
            )
            
            import json
            content = response.get('message', {}).get('content', '')
            if content:
                # Clean the response
                cleaned_content = content.strip()
                if cleaned_content.startswith('```json'):
                    cleaned_content = cleaned_content[7:]
                if cleaned_content.endswith('```'):
                    cleaned_content = cleaned_content[:-3]
                cleaned_content = cleaned_content.strip()
                
                topics = json.loads(cleaned_content)
                if isinstance(topics, list):
                    return [str(topic) for topic in topics[:8]]  # Limit to 8 topics
            
        except Exception as e:
            print(f"Error getting available topics: {e}")
        
        # Fallback topics based on common document types
        return [
            "safety procedures and guidelines",
            "technical specifications",
            "maintenance procedures", 
            "operational instructions",
            "performance data",
            "equipment features",
            "troubleshooting guides"
        ]
    
    def suggest_related_questions(self, query: str, available_topics: list[str]) -> list[str]:
        """
        Suggest related questions based on available topics.
        """
        try:
            prompt = f"""
            The user asked: "{query}"
            
            Available topics in the documents:
            {', '.join(available_topics)}
            
            Suggest 3 related questions that the user could ask about topics that ARE covered in the documents.
            Focus on questions that are similar to their original query but about available topics.
            Return only a JSON array of question strings.
            """
            
            response = ollama.chat(
                model=OLLAMA_MODEL,
                messages=[
                    {"role": "system", "content": "You help users find relevant questions they can ask."},
                    {"role": "user", "content": prompt}
                ],
                options={
                    "temperature": 0.7,
                    "num_ctx": 4096
                }
            )
            
            import json
            content = response.get('message', {}).get('content', '')
            if content:
                # Clean the response
                cleaned_content = content.strip()
                if cleaned_content.startswith('```json'):
                    cleaned_content = cleaned_content[7:]
                if cleaned_content.endswith('```'):
                    cleaned_content = cleaned_content[:-3]
                cleaned_content = cleaned_content.strip()
                
                suggestions = json.loads(cleaned_content)
                if isinstance(suggestions, list):
                    return [str(s) for s in suggestions[:3]]
            
        except Exception as e:
            print(f"Error suggesting related questions: {e}")
        
        return []

    def validate_context(self, query: str, context_chunks: list, retrieval_scores: list = None) -> dict:
        """
        Validates if the retrieved context is sufficient and relevant to answer the query.
        
        Returns:
        {
            "is_sufficient": bool,
            "confidence": float,
            "reason": str,
            "relevant_chunks": list,
            "missing_info": str
        }
        """
        if not context_chunks:
            return {
                "is_sufficient": False,
                "confidence": 0.0,
                "reason": "No context retrieved",
                "relevant_chunks": [],
                "missing_info": "No relevant information found in the documents"
            }

        context_text = "\n".join([f"Chunk {i+1}: {chunk}" for i, (chunk, _) in enumerate(context_chunks)])
        
        # Include retrieval scores if available
        score_info = ""
        if retrieval_scores:
            score_info = f"\nRetrieval scores: {retrieval_scores}"

        prompt = f"""
        Analyze whether the provided context is sufficient to answer the user query accurately.

        User Query: {query}

        Retrieved Context:
        {context_text}{score_info}

        Evaluate the context based on:
        1. Relevance: Does the context directly relate to the query?
        2. Completeness: Does it contain enough information to provide a comprehensive answer?
        3. Accuracy: Is the information likely to be accurate and up-to-date?
        4. Coverage: Does it address all aspects of the query?

        Return a JSON response with the following structure:
        {{
            "is_sufficient": true/false,
            "confidence": 0.0-1.0,
            "reason": "brief explanation",
            "relevant_chunks": [list of chunk indices that are most relevant],
            "missing_info": "what information is missing if insufficient"
        }}
        """

        response = ollama.chat(
            model=OLLAMA_MODEL,
            messages=[
                {"role": "system", "content": "You are a context validation expert. Analyze context relevance and sufficiency."},
                {"role": "user", "content": prompt.strip()}
            ],
            options={
                "temperature": 0.1,
                "num_ctx": 4096
            }
        )

        try:
            import json
            result = json.loads(response.get('message', {}).get('content', '').strip())
            return result
        except json.JSONDecodeError:
            # Fallback response if JSON parsing fails
            return {
                "is_sufficient": False,
                "confidence": 0.0,
                "reason": "Failed to parse validation response",
                "relevant_chunks": [],
                "missing_info": "Unable to validate context sufficiency"
            }

    def get_insufficient_context_response(self, query: str, missing_info: str) -> str:
        """
        Generates a helpful response when context is insufficient.
        """
        # Get available topics and suggest related questions
        available_topics = self.get_available_topics()
        related_questions = self.suggest_related_questions(query, available_topics)
        
        # Build a helpful response
        response_parts = []
        
        # Main message
        response_parts.append(f"I don't have enough specific information to answer your question about '{query}'.")
        
        # If we have some context but it's insufficient, mention it
        if "No relevant information found" not in missing_info:
            response_parts.append(f"While I found some related information, it doesn't fully address your specific question.")
        
        # Suggest what topics ARE available
        if available_topics:
            response_parts.append(f"\nHowever, I can help you with topics that ARE covered in the available documents, such as:")
            response_parts.append(f"• {', '.join(available_topics[:4])}")  # Show first 4 topics
        
        # Suggest related questions
        if related_questions:
            response_parts.append(f"\nHere are some related questions you could ask instead:")
            for i, question in enumerate(related_questions, 1):
                response_parts.append(f"{i}. {question}")
        
        # General guidance
        response_parts.append(f"\n💡 **Tips for better results:**")
        response_parts.append(f"• Try asking about specific equipment, procedures, or features mentioned in the documents")
        response_parts.append(f"• Use more specific terms rather than general concepts")
        response_parts.append(f"• Ask about safety, maintenance, specifications, or operational procedures")
        
        return "\n".join(response_parts)