import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.services.retrieval import TimestampGatedRetriever
from app.services.llm_adapter import LLMAdapter

logger = logging.getLogger(__name__)


class SummaryService:
    def __init__(self, db: Session):
        self.db = db
        self.retriever = TimestampGatedRetriever(db)
        self.llm = LLMAdapter()

    def generate_summary(
        self,
        course_id: str,
        lesson_id: Optional[str],
        current_time_seconds: float
    ) -> Dict[str, Any]:
        """
        Generates structured summary of lecture content covered strictly up to current_time_seconds.
        """
        eligible = self.retriever.get_eligible_chunks(course_id, lesson_id, current_time_seconds)
        if not eligible:
            return {
                "summary": "No lecture content has elapsed yet at this position. Press play to begin learning!",
                "key_takeaways": [],
                "covered_time_seconds": current_time_seconds,
                "citations": []
            }

        # Select representative chunks across the elapsed timeline
        sorted_chunks = sorted(
            [c for c in eligible if c.resource_type == "video_transcript"],
            key=lambda x: (x.start_seconds or 0.0)
        )
        if not sorted_chunks:
            sorted_chunks = eligible[:4]

        # Pick up to 5 points
        takeaways = []
        citations = []
        for c in sorted_chunks[:5]:
            snippet = c.text.strip()
            # Clean first sentence
            first_sent = snippet.split(".")[0].strip()
            if len(first_sent) > 20:
                takeaways.append(first_sent + ".")
            else:
                takeaways.append(snippet[:120] + "...")

            citations.append({
                "source_type": c.resource_type,
                "source_name": c.lesson.title if c.lesson else "Lecture",
                "start_seconds": c.start_seconds,
                "end_seconds": c.end_seconds,
                "excerpt": snippet[:180]
            })

        m = int(current_time_seconds // 60)
        s = int(current_time_seconds % 60)
        header = f"Recap of lesson concepts covered through {m:02d}:{s:02d}:"

        summary_text = f"{header}\n\n" + "\n".join([f"• {t}" for t in takeaways])

        return {
            "summary": summary_text,
            "key_takeaways": takeaways,
            "covered_time_seconds": current_time_seconds,
            "citations": citations[:3]
        }
