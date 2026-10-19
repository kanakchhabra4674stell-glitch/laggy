import logging
import re
from typing import List, Dict, Any, Optional, Tuple
from rank_bm25 import BM25Okapi
from sqlalchemy.orm import Session
from app.db.models import DocumentChunk, Resource, Lesson
from app.services.embeddings import compute_single_embedding, cosine_similarity

logger = logging.getLogger(__name__)


STOP_WORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
    "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't",
    "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during",
    "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have",
    "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's",
    "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll",
    "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself",
    "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not",
    "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours",
    "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll",
    "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's",
    "the", "their", "theirs", "them", "themselves", "then", "there", "there's",
    "these", "they", "they'd", "they'll", "they're", "they've", "this", "those",
    "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we",
    "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when",
    "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why",
    "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours"
}


def tokenize(text: str, remove_stopwords: bool = True) -> List[str]:
    """Tokenizes text for BM25 keyword matching with optional stopword filtering."""
    words = [w.lower() for w in re.findall(r"\b\w+\b", text)]
    if remove_stopwords:
        filtered = [w for w in words if w not in STOP_WORDS]
        return filtered if filtered else words
    return words


class TimestampGatedRetriever:
    """
    Enforces server-side timestamp gating and hybrid RAG retrieval.
    Future transcript segments (end_time_seconds > current_time_seconds)
    are strictly excluded BEFORE any ranking, BM25, or vector indexing.
    """

    def __init__(self, db: Session):
        self.db = db

    def get_eligible_chunks(
        self,
        course_id: str,
        lesson_id: Optional[str],
        current_time_seconds: Optional[float]
    ) -> List[DocumentChunk]:
        """
        Fetches ONLY the chunks that the student is permitted to see at current_time_seconds.
        Strict server-side filter:
        - For video transcripts: chunk.end_seconds <= current_time_seconds (or chunk.start_seconds if end is None).
        - For timeline-locked resources: chunk.unlock_timestamp_seconds <= current_time_seconds.
        - Unrestricted resources (unlock_timestamp_seconds is None) are included.
        """
        query = self.db.query(DocumentChunk).filter(DocumentChunk.course_id == course_id)
        all_chunks = query.all()

        eligible = []
        for c in all_chunks:
            # If chunk is from a lesson video transcript
            if c.resource_type == "video_transcript":
                # If lesson_id is specified and doesn't match, we can skip or include based on course context
                if lesson_id and c.lesson_id and c.lesson_id != lesson_id:
                    continue

                if current_time_seconds is not None:
                    # Strict boundary: must have completed before or at current_time_seconds
                    end_time = c.end_seconds if c.end_seconds is not None else (c.start_seconds or 0.0)
                    if end_time > current_time_seconds:
                        # Excluded by timestamp gate!
                        continue
                eligible.append(c)

            else:
                # Supporting document (PDF, PPTX, notes)
                if c.unlock_timestamp_seconds is not None and current_time_seconds is not None:
                    if c.unlock_timestamp_seconds > current_time_seconds:
                        # Excluded by resource timeline unlock gate!
                        continue
                eligible.append(c)

        return eligible

    def check_future_spoilers(
        self,
        course_id: str,
        lesson_id: Optional[str],
        current_time_seconds: float,
        query_text: str,
        similarity_threshold: float = 0.40
    ) -> Optional[Dict[str, Any]]:
        """
        Inspects future video transcript chunks to see if the user's question
        is asking about a concept that will be taught later.
        IMPORTANT: If the concept has ALREADY been covered in past eligible chunks,
        it is NOT a spoiler—the student is asking about covered material.
        """
        # First check if concept is already covered in past eligible chunks
        eligible_chunks = self.get_eligible_chunks(course_id, lesson_id, current_time_seconds)
        q_tokens = tokenize(query_text)
        if not q_tokens:
            return None

        query_vec = compute_single_embedding(query_text)

        for ec in eligible_chunks:
            ec_tokens = set(tokenize(ec.text))
            keyword_overlap = sum(1 for t in q_tokens if t in ec_tokens) / max(len(q_tokens), 1)
            sim = 0.0
            if ec.embedding_vector:
                sim = cosine_similarity(query_vec, ec.embedding_vector)
            if keyword_overlap >= 0.4 or sim >= 0.45 or (keyword_overlap >= 0.2 and sim >= 0.35):
                # Concept has ALREADY been covered! Do not flag as future spoiler.
                return None

        # If not covered in past, check if it appears in future chunks
        q = self.db.query(DocumentChunk).filter(
            DocumentChunk.course_id == course_id,
            DocumentChunk.resource_type == "video_transcript"
        )
        if lesson_id:
            q = q.filter(DocumentChunk.lesson_id == lesson_id)
        future_chunks = [c for c in q.all() if c.end_seconds is not None and c.end_seconds > current_time_seconds]

        if not future_chunks:
            return None

        best_future_chunk = None
        best_score = 0.0

        for chunk in future_chunks:
            sim = 0.0
            if chunk.embedding_vector:
                sim = cosine_similarity(query_vec, chunk.embedding_vector)
            
            c_tokens = set(tokenize(chunk.text))
            keyword_overlap = sum(1 for t in q_tokens if t in c_tokens) / max(len(q_tokens), 1)

            combined_score = 0.6 * sim + 0.4 * keyword_overlap
            if combined_score > best_score:
                best_score = combined_score
                best_future_chunk = chunk

        if best_future_chunk and best_score >= similarity_threshold:
            start_m = int((best_future_chunk.start_seconds or 0) // 60)
            start_s = int((best_future_chunk.start_seconds or 0) % 60)
            time_str = f"{start_m:02d}:{start_s:02d}"
            return {
                "is_future": True,
                "future_start_seconds": best_future_chunk.start_seconds,
                "future_end_seconds": best_future_chunk.end_seconds,
                "future_time_formatted": time_str,
                "concept_excerpt": best_future_chunk.text[:120] + "...",
                "score": best_score
            }

        return None

    def hybrid_search(
        self,
        course_id: str,
        query_text: str,
        lesson_id: Optional[str] = None,
        current_time_seconds: Optional[float] = None,
        top_k: int = 4
    ) -> List[Dict[str, Any]]:
        """
        Executes hybrid BM25 + Vector retrieval strictly over eligible chunks.
        Combines ranks using Reciprocal Rank Fusion (RRF):
        RRF_score = 1 / (60 + rank_bm25) + 1 / (60 + rank_semantic)
        """
        eligible_chunks = self.get_eligible_chunks(course_id, lesson_id, current_time_seconds)
        if not eligible_chunks:
            return []

        # 1. BM25 Retrieval
        corpus_tokens = [tokenize(c.text) for c in eligible_chunks]
        bm25 = BM25Okapi(corpus_tokens)
        query_tokens = tokenize(query_text)
        bm25_scores = bm25.get_scores(query_tokens)

        # Sort indices by BM25
        bm25_ranked_indices = sorted(range(len(eligible_chunks)), key=lambda i: bm25_scores[i], reverse=True)
        bm25_ranks = {idx: rank + 1 for rank, idx in enumerate(bm25_ranked_indices)}

        # 2. Semantic Vector Retrieval
        query_vec = compute_single_embedding(query_text)
        semantic_scores = []
        for c in eligible_chunks:
            if c.embedding_vector:
                sim = cosine_similarity(query_vec, c.embedding_vector)
            else:
                sim = 0.0
            semantic_scores.append(sim)

        semantic_ranked_indices = sorted(range(len(eligible_chunks)), key=lambda i: semantic_scores[i], reverse=True)
        semantic_ranks = {idx: rank + 1 for rank, idx in enumerate(semantic_ranked_indices)}

        # 3. Reciprocal Rank Fusion (RRF)
        rrf_k = 60.0
        candidate_scores = []
        for idx, chunk in enumerate(eligible_chunks):
            r_bm25 = bm25_ranks[idx]
            r_sem = semantic_ranks[idx]
            
            # Only count BM25 if there's actual word match
            bm25_term = 1.0 / (rrf_k + r_bm25) if bm25_scores[idx] > 0 else 0.0
            sem_term = 1.0 / (rrf_k + r_sem) if semantic_scores[idx] > 0.15 else 0.0

            rrf_score = bm25_term + sem_term
            # Absolute semantic similarity for confidence calibration
            sem_sim = semantic_scores[idx]
            candidate_scores.append((chunk, rrf_score, sem_sim, bm25_scores[idx]))

        # Sort by RRF score
        candidate_scores.sort(key=lambda x: x[1], reverse=True)

        results = []
        for chunk, rrf_score, sem_sim, bm25_s in candidate_scores[:top_k]:
            # Filter out chunks with zero relevance on both modalities
            if sem_sim < 0.20 and bm25_s == 0:
                continue

            # Determine source title
            source_title = "Lesson Video"
            if chunk.resource_type == "video_transcript":
                if chunk.lesson:
                    source_title = f"Video: {chunk.lesson.title}"
            elif chunk.resource:
                source_title = f"{chunk.resource.title} ({chunk.resource.file_type.upper()})"

            results.append({
                "chunk_id": chunk.id,
                "course_id": chunk.course_id,
                "lesson_id": chunk.lesson_id,
                "resource_id": chunk.resource_id,
                "resource_type": chunk.resource_type,
                "source_name": source_title,
                "text": chunk.text,
                "start_seconds": chunk.start_seconds,
                "end_seconds": chunk.end_seconds,
                "page_number": chunk.page_number,
                "slide_number": chunk.slide_number,
                "rrf_score": round(rrf_score, 4),
                "semantic_similarity": round(sem_sim, 4),
                "bm25_score": round(float(bm25_s), 4),
                "unlock_timestamp_seconds": chunk.unlock_timestamp_seconds
            })

        return results
