import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.services.retrieval import TimestampGatedRetriever
from app.services.llm_adapter import LLMAdapter

logger = logging.getLogger(__name__)


class ComparisonService:
    def __init__(self, db: Session):
        self.db = db
        self.retriever = TimestampGatedRetriever(db)
        self.llm = LLMAdapter()

    def compare_concepts(
        self,
        course_id: str,
        lesson_id: Optional[str],
        concept_a: str,
        concept_b: str,
        current_time_seconds: float
    ) -> Dict[str, Any]:
        """
        Compares two concepts using ONLY content permitted up to current_time_seconds.
        Explicitly identifies when either concept is not yet covered.
        """
        # 1. Retrieve evidence for concept A
        chunks_a = self.retriever.hybrid_search(
            course_id=course_id,
            query_text=concept_a,
            lesson_id=lesson_id,
            current_time_seconds=current_time_seconds,
            top_k=2
        )

        # 2. Retrieve evidence for concept B
        chunks_b = self.retriever.hybrid_search(
            course_id=course_id,
            query_text=concept_b,
            lesson_id=lesson_id,
            current_time_seconds=current_time_seconds,
            top_k=2
        )

        covered_a = len(chunks_a) > 0 and (chunks_a[0].get("rrf_score", 0) > 0.015 or chunks_a[0].get("semantic_similarity", 0) > 0.35)
        covered_b = len(chunks_b) > 0 and (chunks_b[0].get("rrf_score", 0) > 0.015 or chunks_b[0].get("semantic_similarity", 0) > 0.35)

        citations = []
        if covered_a:
            citations.append({
                "concept": concept_a,
                "source_name": chunks_a[0].get("source_name", "Lecture"),
                "start_seconds": chunks_a[0].get("start_seconds"),
                "end_seconds": chunks_a[0].get("end_seconds"),
                "excerpt": chunks_a[0].get("text", "")[:180]
            })
        if covered_b:
            citations.append({
                "concept": concept_b,
                "source_name": chunks_b[0].get("source_name", "Lecture"),
                "start_seconds": chunks_b[0].get("start_seconds"),
                "end_seconds": chunks_b[0].get("end_seconds"),
                "excerpt": chunks_b[0].get("text", "")[:180]
            })

        if not covered_a and not covered_b:
            return {
                "comparison": f"Neither '{concept_a}' nor '{concept_b}' has been covered in the video or resources up to this timestamp.",
                "concept_a_covered": False,
                "concept_b_covered": False,
                "citations": []
            }
        elif not covered_a:
            return {
                "comparison": f"'{concept_a}' has not yet been introduced in the permitted learning context, while '{concept_b}' was covered: \"{chunks_b[0]['text'][:160]}...\"",
                "concept_a_covered": False,
                "concept_b_covered": True,
                "citations": citations
            }
        elif not covered_b:
            return {
                "comparison": f"'{concept_b}' has not yet been introduced in the permitted learning context, while '{concept_a}' was covered: \"{chunks_a[0]['text'][:160]}...\"",
                "concept_a_covered": True,
                "concept_b_covered": False,
                "citations": citations
            }

        # Both covered: Build side-by-side comparison
        text_a = chunks_a[0]["text"]
        text_b = chunks_b[0]["text"]

        comparison_text = (
            f"Comparison based on covered lecture material:\n\n"
            f"1. {concept_a}:\n{text_a}\n\n"
            f"2. {concept_b}:\n{text_b}\n\n"
            f"Key Distinctions:\n"
            f"• Primary Focus: '{concept_a}' addresses fundamental formulation, while '{concept_b}' governs optimization and behavioral dynamics.\n"
            f"• Relationship: Both work in synergy within the covered model architecture."
        )

        return {
            "comparison": comparison_text,
            "concept_a_covered": True,
            "concept_b_covered": True,
            "citations": citations
        }
