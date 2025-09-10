# agents/query_suggestion_agent.py
import ollama
import json
import os

OLLAMA_HOST = os.getenv('OLLAMA_HOST', 'http://localhost:11434')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3.1')

class QuerySuggestionAgent:
    def suggest_follow_up_queries(self, chat_history: list, max_suggestions: int = 6) -> list[str]:
        """
        Suggests follow-up queries based on previous conversation history.
        
        Args:
            chat_history: List of previous Q&A pairs in the format [{"question": "...", "answer": "..."}]
            max_suggestions: Maximum number of suggestions to return
            
        Returns:
            List of suggested follow-up questions
        """
        if not chat_history or len(chat_history) < 1:
            return []
        
        # Format conversation history
        conversation_text = ""
        for i, qa in enumerate(chat_history[-10:], 1):  # Use last 10 exchanges
            conversation_text += f"Q{i}: {qa.get('question', '')}\n"
            conversation_text += f"A{i}: {qa.get('answer', '')[:500]}...\n\n"  # Truncate long answers
        
        system_prompt = (
            "You are an intelligent assistant that suggests relevant follow-up questions based on conversation history. "
            "Analyze the previous questions and answers to suggest natural, logical next questions that would help "
            "the user explore the topic further or get more specific information. "
            "Focus on questions that build upon the information already discussed. "
            "Return only a JSON array of question strings, no explanations."
        )
        
        user_prompt = f"""
        Based on this conversation history, suggest {max_suggestions} relevant follow-up questions:
        
        {conversation_text}
        
        Suggest questions that:
        1. Build upon the information already discussed
        2. Ask for more specific details about mentioned topics
        3. Explore related aspects or implications
        4. Are natural continuations of the conversation
        
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
            print(f"DEBUG: Follow-up API Response content: {repr(content)}")  # Debug line
            
            if not content or content.strip() == "":
                print("DEBUG: Empty content received from follow-up API")
                return []
                
            # Try to clean the content before parsing
            cleaned_content = content.strip()
            if cleaned_content.startswith('```json'):
                cleaned_content = cleaned_content[7:]
            if cleaned_content.endswith('```'):
                cleaned_content = cleaned_content[:-3]
            cleaned_content = cleaned_content.strip()
            
            print(f"DEBUG: Follow-up cleaned content: {repr(cleaned_content)}")  # Debug line
            
            suggestions = json.loads(cleaned_content)
            
            # Ensure we return a list of strings
            if isinstance(suggestions, list):
                return [str(s) for s in suggestions[:max_suggestions]]
            else:
                print(f"DEBUG: Follow-up suggestions is not a list: {type(suggestions)}")
                return []
                
        except (json.JSONDecodeError, Exception) as e:
            print(f"Error generating follow-up suggestions: {e}")
            print(f"DEBUG: Follow-up failed content was: {repr(content) if 'content' in locals() else 'No content'}")
            return []
    
    def suggest_clarifying_queries(self, last_question: str, last_answer: str, max_suggestions: int = 2) -> list[str]:
        """
        Suggests clarifying questions when the answer might be incomplete or unclear.
        
        Args:
            last_question: The most recent question asked
            last_answer: The answer received
            max_suggestions: Maximum number of clarifying questions to suggest
            
        Returns:
            List of clarifying questions
        """
        system_prompt = (
            "You are an assistant that suggests clarifying questions when answers might be incomplete or unclear. "
            "Analyze the question and answer to identify areas that might need clarification or more specific information. "
            "Return only a JSON array of clarifying question strings."
        )
        
        user_prompt = f"""
        Analyze this Q&A pair and suggest clarifying questions if needed:
        
        Question: {last_question}
        Answer: {last_answer}
        
        Suggest up to {max_suggestions} clarifying questions that would help get more specific or complete information.
        Only suggest questions if the answer seems incomplete, unclear, or could benefit from more detail.
        
        Return only a JSON array of question strings, or empty array if no clarification is needed.
        """
        
        try:
            response = ollama.chat(
                model=OLLAMA_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                options={
                    "temperature": 0.5,
                    "num_ctx": 4096
                }
            )
            
            content = response.get('message', {}).get('content', '')
            print(f"DEBUG: Clarifying API Response content: {repr(content)}")  # Debug line
            
            if not content or content.strip() == "":
                print("DEBUG: Empty content received from clarifying API")
                return []
                
            # Try to clean the content before parsing
            cleaned_content = content.strip()
            if cleaned_content.startswith('```json'):
                cleaned_content = cleaned_content[7:]
            if cleaned_content.endswith('```'):
                cleaned_content = cleaned_content[:-3]
            cleaned_content = cleaned_content.strip()
            
            print(f"DEBUG: Clarifying cleaned content: {repr(cleaned_content)}")  # Debug line
            
            suggestions = json.loads(cleaned_content)
            
            if isinstance(suggestions, list):
                return [str(s) for s in suggestions[:max_suggestions]]
            else:
                print(f"DEBUG: Clarifying suggestions is not a list: {type(suggestions)}")
                return []
                
        except (json.JSONDecodeError, Exception) as e:
            print(f"Error generating clarifying suggestions: {e}")
            print(f"DEBUG: Clarifying failed content was: {repr(content) if 'content' in locals() else 'No content'}")
            return [] 