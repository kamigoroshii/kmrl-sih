from agents.query_analyzer_agent import QueryAnalyzerAgent
from agents.query_rephrase_agent import QueryRephraseAgent
from agents.answer_validator_agent import AnswerValidatorAgent
from agents.query_splitter_agent import QuerySplitterAgent
from agents.context_analyst_agent import ContextAnalystAgent
from agents.answer_synthesizer_agent import AnswerSynthesizerAgent
from agents.context_validator_agent import ContextValidatorAgent
from tools.embedder import embed_query
from tools.retriever import Retriever
from tools.introspector import AgenticIntrospector
from tools.acronyms import ACRONYM_MAP
from tools.new_llamaparse import extract_keywords
from llm import generate_response
from Ingestion.clip_embedder import embed_text_clip
import re
import time

retriever = Retriever()
introspector = AgenticIntrospector()
CONFIDENCE_THRESHOLD = 0.50
CLIP_CONFIDENCE_THRESHOLD = 0.15  # Lower threshold for CLIP searches since similarity scores are typically lower

def expand_acronyms(text):
    for short, full in ACRONYM_MAP.items():
        text = text.replace(f" {short} ", f" {full} ({short}) ")
    return text

def single_query_pipeline(query, top_k=5, recursion_depth=0, tried_with_filename=False):
    query = expand_acronyms(query)
    query_emb = embed_query(query)

    # Semantic Search - search OCR collection with text embeddings
    semantic_results = retriever.search(query_emb, top_k=top_k, search_both_collections=False)
    confident_chunks = [(chunk, src) for chunk, src, score, vector_type in semantic_results if score >= CONFIDENCE_THRESHOLD]
    retrieval_scores = [score for _, _, score, _ in semantic_results]

    # Also try CLIP search for image-related queries
    try:
        clip_query_emb = embed_text_clip(query)
        # Search CLIP collection with 1536-dim vectors (same as OCR)
        clip_results = retriever.search_single_collection(clip_query_emb, top_k=top_k, filters=None, collection_name="Agentic_RAGv2_CLIP")
        clip_confident_chunks = [(chunk, src) for chunk, src, score, vector_type in clip_results if score >= CLIP_CONFIDENCE_THRESHOLD]
        clip_retrieval_scores = [score for _, _, score, _ in clip_results]
        
        # Combine results from both searches
        all_confident_chunks = confident_chunks + clip_confident_chunks
        all_retrieval_scores = retrieval_scores + clip_retrieval_scores
        
        # Remove duplicates while preserving order
        seen = set()
        unique_chunks = []
        unique_scores = []
        for i, (chunk, src) in enumerate(all_confident_chunks):
            if (chunk, src) not in seen:
                seen.add((chunk, src))
                unique_chunks.append((chunk, src))
                if i < len(all_retrieval_scores):
                    unique_scores.append(all_retrieval_scores[i])
        
        confident_chunks = unique_chunks
        retrieval_scores = unique_scores
        
    except Exception as e:
        print(f"CLIP search failed: {e}")
        # Continue with only OCR results

    if confident_chunks:
        introspector.log_query(query, query_emb, semantic_results, 0, "semantic")
        introspector.save_logs()
        return confident_chunks, "semantic", retrieval_scores

    # Keyword Fallback
    all_chunks = retriever.get_all_chunks()
    keywords = extract_keywords(query)
    def score_chunk(text):
        words = re.findall(r'\b\w+\b', text.lower())
        return sum(word in keywords for word in words)

    scored_chunks = [(chunk, src, score_chunk(chunk)) for chunk, src in all_chunks]
    sorted_chunks = sorted(scored_chunks, key=lambda x: x[2], reverse=True)
    top_chunks = [(chunk, src) for chunk, src, score in sorted_chunks if score > 0][:top_k]
    keyword_scores = [score for _, _, score in sorted_chunks if score > 0][:top_k]

    if top_chunks:
        keyword_hits = max((score for _, _, score in scored_chunks), default=0)
        introspector.log_query(query, query_emb, semantic_results, keyword_hits, "keyword")
        introspector.save_logs()
        return top_chunks, "keyword", keyword_scores

    if not tried_with_filename:
        retry_query = f"{query} in tata or reliance"
        return single_query_pipeline(retry_query, top_k, recursion_depth, tried_with_filename=True)

    return [], "none", []

def answer_query(query, top_k=3, recursion_depth=0, max_depth=2):
    print(f"\n🔍 [Depth {recursion_depth}] Received query: {query}")
    if recursion_depth > max_depth:
        print("⛔ Max recursion depth reached.")
        return [], "max-depth", "Maximum recursion depth reached."

    # Initialize agents
    analyzer = QueryAnalyzerAgent()
    rephraser = QueryRephraseAgent()
    validator = AnswerValidatorAgent()
    splitter = QuerySplitterAgent()
    analyst = ContextAnalystAgent()
    synthesizer = AnswerSynthesizerAgent()
    context_validator = ContextValidatorAgent()

    print("🔎 Checking query clarity...")
    # if not analyzer.is_query_clear(query):
    #     print("🟡 Query is unclear.")
    #     return [], "unclear", "Please provide more specific details."
    # print("✅ Query is clear.")

    sub_questions = splitter.split(query)
    if len(sub_questions) == 1:
        print("🧩 No sub-questions found. Treating entire query as one.")
        sub_questions = [query]
    else:
        print(f"🧩 Split into {len(sub_questions)} sub-questions:\n- " + "\n- ".join(sub_questions))

    all_chunks, sub_answers, seen_chunks = [], [], set()

    for i, sub_q in enumerate(sub_questions):
        print(f"\n🔸 Handling sub-question {i + 1}/{len(sub_questions)}: {sub_q}")

        refined_q = analyst.rewrite(sub_q, context=query)
        print(f"✏️ Rewritten sub-question: {refined_q}")

        t0 = time.time()
        chunks, mode, scores = single_query_pipeline(refined_q, top_k, recursion_depth)
        print(f"📥 Retrieval method used: {mode.upper()} — Found {len(chunks)} chunks. Retrieval time: {time.time() - t0:.2f}s")

        # Validate context sufficiency only if min score < 0.6
        t1 = time.time()
        if scores and min(scores) < 0.6:
            print("🔍 Validating context sufficiency (low confidence)...")
            context_validation = context_validator.validate_context(refined_q, chunks, scores)
            print(f"Context validation time: {time.time() - t1:.2f}s")
        else:
            context_validation = {"is_sufficient": True, "confidence": 1.0}
            print("Skipping context validation (high confidence retrieval).")

        if not context_validation["is_sufficient"]:
            print(f"⚠️ Insufficient context: {context_validation['reason']}")
            insufficient_answer = context_validator.get_insufficient_context_response(
                refined_q, context_validation["missing_info"]
            )
            sub_answers.append(insufficient_answer)
            continue

        print(f"✅ Context validated with confidence: {context_validation['confidence']:.2f}")

        if not chunks:
            print("🔁 No chunks found. Rephrasing and retrying...")
            new_query = rephraser.rephrase(refined_q, context_hint=query)
            print(f"🔄 Rephrased query: {new_query}")
            chunks, mode, scores = single_query_pipeline(new_query, top_k, recursion_depth + 1)
            # Re-validate context after rephrasing
            if chunks:
                context_validation = context_validator.validate_context(new_query, chunks, scores)
                if not context_validation["is_sufficient"]:
                    print(f"⚠️ Still insufficient context after rephrasing: {context_validation['reason']}")
                    insufficient_answer = context_validator.get_insufficient_context_response(
                        new_query, context_validation["missing_info"]
                    )
                    sub_answers.append(insufficient_answer)
                    continue

        # Generate answer only if we have sufficient context
        if chunks:
            t2 = time.time()
            response_data = generate_response(refined_q, chunks)
            print(f"LLM answer time: {time.time() - t2:.2f}s")
            answer = response_data["answer"]
            used_chunk_indices = response_data["used_chunks"]
            # Get only the chunks that were actually used by the AI
            used_chunks = [chunks[i] for i in used_chunk_indices if i < len(chunks)]
            # Additional answer validation
            if answer and not validator.validate(answer, used_chunks, refined_q):
                print("⚠️ Answer validation failed. Marking answer as unvalidated.")
                answer = "The answer could not be confidently validated from context."
            else:
                print("✅ Answer validated.")
            for chunk, src in used_chunks:
                key = (chunk.strip(), src.strip())
                if key not in seen_chunks:
                    seen_chunks.add(key)
                    all_chunks.append((chunk, src))
            sub_answers.append(answer)
        else:
            # No chunks found even after rephrasing
            insufficient_answer = context_validator.get_insufficient_context_response(
                refined_q, "No relevant information found in the available documents"
            )
            sub_answers.append(insufficient_answer)

    t3 = time.time()
    print(f"\n🧠 Synthesizing final answer from {len(sub_questions)} sub-answers...")
    final_answer = synthesizer.summarize(query, sub_questions, sub_answers)
    print(f"✅ Final answer generated. Synthesis time: {time.time() - t3:.2f}s")

    return all_chunks, "synthesis", final_answer
