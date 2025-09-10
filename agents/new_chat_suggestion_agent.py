# agents/new_chat_suggestion_agent.py
import ollama
import json
import random
import os
from typing import List
from tools.retriever import Retriever

OLLAMA_HOST = os.getenv('OLLAMA_HOST', 'http://localhost:11434')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3.1')

class NewChatSuggestionAgent:
    def __init__(self):
        self.retriever = Retriever()
        self._cached_suggestions = None
        self._cache_timestamp = 0
        self._cache_duration = 3600  # 1 hour cache
    
    def get_document_overview(self) -> str:
        """
        Get an overview of available documents to base suggestions on.
        """
        try:
            all_chunks = self.retriever.get_all_chunks()
            if not all_chunks:
                return "No documents available"
            
            # Sample chunks to understand document content
            sample_chunks = random.sample(all_chunks, min(20, len(all_chunks)))
            
            # Extract unique sources
            sources = set()
            content_samples = []
            
            for chunk, src in sample_chunks:
                sources.add(src)
                content_samples.append(chunk[:200])  # First 200 chars of each chunk
            
            overview = f"Available documents: {len(sources)} files\n"
            overview += f"Sample sources: {', '.join(list(sources)[:5])}\n"
            overview += f"Content samples:\n" + "\n".join(content_samples[:10])
            
            return overview
            
        except Exception as e:
            print(f"Error getting document overview: {e}")
            return "Documents available but unable to analyze content"
    
    def suggest_new_chat_questions(self, max_suggestions: int = 5, user_preference: str = "") -> list[str]:
        """
        Suggests different questions for new chats based on available documents.
        
        Args:
            max_suggestions: Maximum number of suggestions to return
            user_preference: Optional user preference or topic of interest
            
        Returns:
            List of suggested questions for new chats
        """
        # Check cache first
        import time
        current_time = time.time()
        if (self._cached_suggestions and 
            current_time - self._cache_timestamp < self._cache_duration):
            return random.sample(self._cached_suggestions, 
                               min(max_suggestions, len(self._cached_suggestions)))
        
        document_overview = self.get_document_overview()
        
        system_prompt = (
            "You are an intelligent assistant that suggests interesting and diverse questions "
            "for new chat sessions based on available documents. Your goal is to help users "
            "discover what they can ask about the available content. "
            "Suggest questions that are engaging, varied in complexity, and cover different aspects "
            "of the available documents. Return only a JSON array of question strings."
        )
        
        user_prompt = f"""
        Based on the available documents, suggest {max_suggestions} interesting questions for a new chat session.
        
        Document Overview:
        {document_overview}
        
        User Preference: {user_preference if user_preference else "No specific preference"}
        
        Suggest questions that:
        1. Are diverse and cover different topics
        2. Vary in complexity (some simple, some detailed)
        3. Are engaging and likely to lead to interesting discussions
        4. Help users explore the available content
        5. Are specific enough to get meaningful answers
        
        Return only a JSON array of {max_suggestions} question strings.
        """
        
        try:
            response = ollama.chat(
                model=OLLAMA_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                options={
                    "temperature": 0.8,
                    "num_ctx": 4096
                }
            )
            
            content = response.get('message', {}).get('content', '')
            print(f"DEBUG: API Response content: {repr(content)}")  # Debug line
            
            if not content or content.strip() == "":
                print("DEBUG: Empty content received from API")
                return self._get_fallback_suggestions(max_suggestions)
                
            # Try to clean the content before parsing
            cleaned_content = content.strip()
            if cleaned_content.startswith('```json'):
                cleaned_content = cleaned_content[7:]
            if cleaned_content.endswith('```'):
                cleaned_content = cleaned_content[:-3]
            cleaned_content = cleaned_content.strip()
            
            print(f"DEBUG: Cleaned content: {repr(cleaned_content)}")  # Debug line
            
            suggestions = json.loads(cleaned_content)
            
            if isinstance(suggestions, list):
                # Cache the suggestions
                self._cached_suggestions = suggestions
                self._cache_timestamp = current_time
                
                return [str(s) for s in suggestions[:max_suggestions]]
            else:
                print(f"DEBUG: Suggestions is not a list: {type(suggestions)}")
                return self._get_fallback_suggestions(max_suggestions)
                
        except (json.JSONDecodeError, Exception) as e:
            print(f"Error generating new chat suggestions: {e}")
            print(f"DEBUG: Failed content was: {repr(content) if 'content' in locals() else 'No content'}")
            return self._get_fallback_suggestions(max_suggestions)
    
    def _get_fallback_suggestions(self, max_suggestions: int) -> list[str]:
        """
        Fallback suggestions when AI generation fails.
        """
        fallback_suggestions = [
            "What are the main topics covered in the available documents?",
            "Can you provide an overview of the key information in these documents?",
            "What are the most important findings or conclusions mentioned?",
            "Are there any specific procedures or guidelines described?",
            "What technical specifications or requirements are mentioned?",
            "Can you summarize the main sections or chapters?",
            "What are the key terms or concepts used throughout the documents?",
            "Are there any safety considerations or warnings mentioned?",
            "What maintenance or operational procedures are described?",
            "Can you identify the target audience or intended users of these documents?"
        ]
        
        return random.sample(fallback_suggestions, min(max_suggestions, len(fallback_suggestions)))
    
    def suggest_topic_based_questions(self, topic: str, max_suggestions: int = 3) -> list[str]:
        """
        Suggests questions focused on a specific topic.
        
        Args:
            topic: The specific topic to focus on
            max_suggestions: Maximum number of suggestions to return
            
        Returns:
            List of topic-specific questions
        """
        document_overview = self.get_document_overview()
        
        system_prompt = (
            "You are an assistant that suggests focused questions about specific topics "
            "based on available documents. Return only a JSON array of question strings."
        )
        
        user_prompt = f"""
        Suggest {max_suggestions} questions specifically about "{topic}" based on the available documents.
        
        Document Overview:
        {document_overview}
        
        Focus on questions that:
        1. Are specifically about the given topic
        2. Will help users understand that topic better
        3. Are likely to have relevant information in the documents
        4. Vary in depth and scope
        
        Return only a JSON array of {max_suggestions} question strings.
        """
        
        try:
            response = ollama.chat(
                model=OLLAMA_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                options={
                    "temperature": 0.6,
                    "num_ctx": 4096
                }
            )
            
            content = response.get('message', {}).get('content', '')
            print(f"DEBUG: Topic API Response content: {repr(content)}")  # Debug line
            
            if not content or content.strip() == "":
                print("DEBUG: Empty content received from topic API")
                return []
                
            # Try to clean the content before parsing
            cleaned_content = content.strip()
            if cleaned_content.startswith('```json'):
                cleaned_content = cleaned_content[7:]
            if cleaned_content.endswith('```'):
                cleaned_content = cleaned_content[:-3]
            cleaned_content = cleaned_content.strip()
            
            print(f"DEBUG: Topic cleaned content: {repr(cleaned_content)}")  # Debug line
            
            suggestions = json.loads(cleaned_content)
            
            if isinstance(suggestions, list):
                return [str(s) for s in suggestions[:max_suggestions]]
            else:
                print(f"DEBUG: Topic suggestions is not a list: {type(suggestions)}")
                return []
                
        except (json.JSONDecodeError, Exception) as e:
            print(f"Error generating topic-based suggestions: {e}")
            print(f"DEBUG: Topic failed content was: {repr(content) if 'content' in locals() else 'No content'}")
            return [] 