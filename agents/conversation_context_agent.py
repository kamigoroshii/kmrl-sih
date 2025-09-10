import ollama
import os
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from pymongo import MongoClient

OLLAMA_HOST = os.getenv('OLLAMA_HOST', 'http://localhost:11434')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3.1')

class ConversationContextAgent:
    def __init__(self, mongo_client: MongoClient, db_name: str = "chatbot"):
        """Initialize the Conversation Context Agent."""
        self.db = mongo_client[db_name]
        self.chats_collection = self.db["chats"]
    
    def get_conversation_history(self, user_id: str, chat_id: str, limit: int = 5) -> List[Dict[str, str]]:
        """
        Get conversation history for a specific chat session.
        
        Args:
            user_id: User ID
            chat_id: Chat session ID
            limit: Number of recent messages to retrieve
            
        Returns:
            List of conversation messages in OpenAI format
        """
        try:
            # Fetch previous messages in this chat session
            previous_messages = list(self.chats_collection.find({
                "user_id": user_id,
                "chat_id": chat_id
            }).sort("timestamp", 1))  # Sort by timestamp ascending (oldest first)
            
            # Build conversation history for context
            conversation_history = []
            for msg in previous_messages[-limit:]:  # Last N messages for context
                conversation_history.append({
                    "role": "user",
                    "content": msg.get("question", "")
                })
                conversation_history.append({
                    "role": "assistant", 
                    "content": msg.get("answer", "")
                })
            
            return conversation_history
            
        except Exception as e:
            print(f"Error getting conversation history: {e}")
            return []
    
    def is_followup_question(self, query: str, conversation_history: List[Dict[str, str]]) -> bool:
        """
        Determine if a query is a follow-up question based on conversation history.
        
        Args:
            query: Current user query
            conversation_history: Previous conversation messages
            
        Returns:
            True if it's likely a follow-up question
        """
        if not conversation_history:
            return False
        
        # Check for follow-up indicators
        followup_indicators = [
            "what about", "how about", "and", "also", "additionally", "furthermore",
            "moreover", "besides", "in addition", "what else", "tell me more",
            "explain", "clarify", "elaborate", "expand", "go deeper", "continue",
            "next", "then", "after that", "what happens", "what if", "can you",
            "could you", "would you", "please", "thanks", "thank you"
        ]
        
        query_lower = query.lower()
        
        # Check for explicit follow-up indicators
        for indicator in followup_indicators:
            if indicator in query_lower:
                return True
        
        # Check for pronouns that reference previous context
        context_pronouns = ["it", "this", "that", "these", "those", "they", "them", "their"]
        words = query_lower.split()
        pronoun_count = sum(1 for word in words if word in context_pronouns)
        
        # If more than 20% of words are context pronouns, likely a follow-up
        if len(words) > 0 and pronoun_count / len(words) > 0.2:
            return True
        
        # Check for short queries that might be follow-ups
        if len(query.split()) <= 3 and any(word in query_lower for word in ["yes", "no", "ok", "sure", "right"]):
            return True
        
        return False
    
    def enhance_answer_with_context(self, query: str, base_answer: str, 
                                  conversation_history: List[Dict[str, str]], 
                                  retrieved_context: str) -> str:
        """
        Enhance the base answer with conversation context for follow-up questions.
        
        Args:
            query: Current user query
            base_answer: Base answer from RAG system
            conversation_history: Previous conversation messages
            retrieved_context: Retrieved context from documents
            
        Returns:
            Enhanced answer with conversation context
        """
        try:
            if not conversation_history:
                return base_answer
            
            # Create conversation context string
            conversation_context = "\n".join([
                f"{msg['role']}: {msg['content']}" 
                for msg in conversation_history[-6:]  # Last 3 exchanges
            ])
            
            # Create enhanced prompt
            enhanced_prompt = f"""Based on the following conversation history and retrieved context, answer the user's follow-up question.

Conversation History:
{conversation_context}

Retrieved Context:
{retrieved_context}

User's Follow-up Question: {query}

Please provide a comprehensive answer that:
1. Addresses the specific follow-up question
2. References relevant information from the conversation history when appropriate
3. Uses the retrieved context to provide accurate information
4. Maintains continuity with the previous conversation
5. Provides a natural, conversational response

If the follow-up question doesn't require additional context from the conversation history, use the retrieved context to provide a direct answer.

Answer:"""
            
            # Generate enhanced response
            response = ollama.chat(
                model=OLLAMA_MODEL,
                messages=[
                    {
                        "role": "system", 
                        "content": "You are a helpful assistant that provides context-aware answers to follow-up questions. Maintain conversation continuity while being accurate and informative."
                    },
                    {
                        "role": "user",
                        "content": enhanced_prompt
                    }
                ],
                options={
                    "temperature": 0.3,
                    "num_ctx": 4096
                }
            )
            
            enhanced_answer = response.get('message', {}).get('content', '')
            
            # If the enhanced answer is significantly different and better, use it
            if enhanced_answer and len(enhanced_answer.strip()) > len(base_answer.strip()) * 0.8:
                return enhanced_answer
            else:
                return base_answer
                
        except Exception as e:
            print(f"Error enhancing answer with context: {e}")
            return base_answer
    
    def generate_contextual_response(self, query: str, user_id: str, chat_id: str, 
                                   base_answer: str, retrieved_context: str) -> Dict[str, Any]:
        """
        Generate a contextual response for a query, handling follow-up questions.
        
        Args:
            query: User query
            user_id: User ID
            chat_id: Chat session ID
            base_answer: Base answer from RAG system
            retrieved_context: Retrieved context from documents
            
        Returns:
            Dictionary with enhanced answer and metadata
        """
        try:
            # Get conversation history
            conversation_history = self.get_conversation_history(user_id, chat_id)
            
            # Check if this is a follow-up question
            is_followup = self.is_followup_question(query, conversation_history)
            
            # Enhance answer if it's a follow-up question
            if is_followup:
                enhanced_answer = self.enhance_answer_with_context(
                    query, base_answer, conversation_history, retrieved_context
                )
            else:
                enhanced_answer = base_answer
            
            return {
                "answer": enhanced_answer,
                "is_followup": is_followup,
                "conversation_length": len(conversation_history),
                "original_answer": base_answer if is_followup else None
            }
            
        except Exception as e:
            print(f"Error generating contextual response: {e}")
            return {
                "answer": base_answer,
                "is_followup": False,
                "conversation_length": 0,
                "error": str(e)
            }
    
    def suggest_followup_questions(self, conversation_history: List[Dict[str, str]], 
                                 current_answer: str, max_suggestions: int = 6) -> List[str]:
        """
        Suggest relevant follow-up questions based on conversation history and current answer.
        
        Args:
            conversation_history: Previous conversation messages
            current_answer: Current answer to generate suggestions from
            
        Returns:
            List of suggested follow-up questions (4-8 questions)
        """
        try:
            # If no conversation history but we have a current answer, generate suggestions based on that
            if not conversation_history and not current_answer:
                return []
            
            # Handle first message case - generate suggestions based on current answer only
            if not conversation_history or len(conversation_history) <= 2:
                if current_answer:
                    return self._generate_first_message_suggestions(current_answer, max_suggestions)
                else:
                    return []
            
            # Use more conversation history (5-10 previous exchanges)
            history_limit = min(10, len(conversation_history))
            recent_context = "\n".join([
                f"{msg['role']}: {msg['content']}" 
                for msg in conversation_history[-history_limit:]  # Last 5-10 exchanges
            ])
            
            # Generate 4-8 questions, but respect the max_suggestions parameter
            num_suggestions = min(max_suggestions, max(4, len(conversation_history) // 2 + 2))
            
            prompt = f"""Based on the following conversation and answer, suggest {num_suggestions} relevant follow-up questions that the user might want to ask.

Recent Conversation (Last {history_limit} exchanges):
{recent_context}

Current Answer:
{current_answer}

Generate {num_suggestions} natural follow-up questions that:
1. Build upon the current topic and previous discussions
2. Explore related aspects or implications
3. Ask for clarification or more specific details
4. Are specific and actionable
5. Consider the full conversation context, not just the last exchange
6. Vary in complexity and depth
7. Help users explore different angles of the topic
8. Are natural continuations of the conversation flow

Return only the questions, one per line, without numbering or explanations."""

            response = ollama.chat(
                model=OLLAMA_MODEL,
                messages=[
                    {
                        "role": "system", 
                        "content": "You are an expert at suggesting relevant follow-up questions based on conversation context. Generate diverse, thoughtful questions that build upon the entire conversation history."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                options={
                    "temperature": 0.8,
                    "num_ctx": 4096
                }
            )
            
            suggestions = response.get('message', {}).get('content', '').strip().split('\n')
            # Clean up suggestions
            cleaned_suggestions = []
            for suggestion in suggestions:
                suggestion = suggestion.strip()
                if suggestion and not suggestion.startswith(('1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '-', '*')):
                    cleaned_suggestions.append(suggestion)
            
            return cleaned_suggestions[:num_suggestions]  # Return 4-8 suggestions
            
        except Exception as e:
            print(f"Error suggesting follow-up questions: {e}")
            return []

    def _generate_first_message_suggestions(self, current_answer: str, max_suggestions: int = 6) -> List[str]:
        """
        Generate follow-up suggestions for the first message based only on the current answer.
        """
        try:
            # For first message, generate 4-6 suggestions based on the answer content
            num_suggestions = min(max_suggestions, 6)
            
            prompt = f"""Based on the following answer to a user's first question, suggest {num_suggestions} relevant follow-up questions that would help the user explore the topic further.

Answer:
{current_answer}

Generate {num_suggestions} natural follow-up questions that:
1. Build upon the information provided in the answer
2. Ask for more specific details about mentioned topics
3. Explore related aspects or implications
4. Help the user dive deeper into the subject
5. Are specific and actionable
6. Would naturally follow from the given answer

Return only the questions, one per line, without numbering or explanations."""

            response = ollama.chat(
                model=OLLAMA_MODEL,
                messages=[
                    {
                        "role": "system", 
                        "content": "You are an expert at suggesting relevant follow-up questions based on provided answers. Generate diverse, thoughtful questions that build upon the given information."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                options={
                    "temperature": 0.8,
                    "num_ctx": 4096
                }
            )
            
            suggestions = response.get('message', {}).get('content', '').strip().split('\n')
            # Clean up suggestions
            cleaned_suggestions = []
            for suggestion in suggestions:
                suggestion = suggestion.strip()
                # Remove numbering, bullets, and empty lines
                if suggestion and not suggestion.startswith(('1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '-', '*', '•')):
                    cleaned_suggestions.append(suggestion)
            
            return cleaned_suggestions[:num_suggestions]
            
        except Exception as e:
            print(f"Error generating first message suggestions: {e}")
            return [] 