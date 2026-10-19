import uuid
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.db.models import ChatMessage
from app.services.retrieval import TimestampGatedRetriever
from app.services.llm_adapter import LLMAdapter

logger = logging.getLogger(__name__)


def detect_intent(question: str) -> str:
    q = question.lower()
    if any(k in q for k in ["analogy", "example", "like what", "metaphor"]):
        return "analogy"
    elif any(k in q for k in ["where", "which slide", "what timestamp", "when was", "locate"]):
        return "where_discussed"
    elif any(k in q for k in ["summarize", "summary", "recap", "overview so far"]):
        return "summary"
    elif any(k in q for k in ["compare", "difference between", "versus", "vs"]):
        return "compare"
    elif any(k in q for k in ["simple", "eli5", "simply", "layman"]):
        return "explain_simply"
    elif any(k in q for k in ["instructor mean", "prof mean", "teacher mean", "clarify"]):
        return "instructor_intent"
    return "explain"


class TutorService:
    def __init__(self, db: Session):
        self.db = db
        self.retriever = TimestampGatedRetriever(db)
        self.llm = LLMAdapter()

    def ask(
        self,
        course_id: str,
        question: str,
        current_time_seconds: Optional[float] = None,
        lesson_id: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Main doubt-solving entry point with timestamp authorization and spoiler prevention.
        """
        intent = detect_intent(question)

        # 1. Check for Future Spoilers (if playback time is specified)
        if current_time_seconds is not None:
            spoiler = self.retriever.check_future_spoilers(
                course_id=course_id,
                lesson_id=lesson_id,
                current_time_seconds=current_time_seconds,
                query_text=question
            )
            if spoiler:
                resp = {
                    "answer": f"This concept appears later in the lesson (around {spoiler['future_time_formatted']}) and has not yet been covered in your playback context. We keep this gated to avoid spoiling the explanation!",
                    "citations": [],
                    "confidence": "high",
                    "abstained": True,
                    "spoiler_prevented": True,
                    "context_timestamp_seconds": current_time_seconds,
                    "future_start_seconds": spoiler["future_start_seconds"],
                    "provider": "timestamp_gate"
                }
                self._save_chat_message(
                    course_id=course_id,
                    lesson_id=lesson_id,
                    session_id=session_id,
                    question=question,
                    response=resp,
                    current_time_seconds=current_time_seconds
                )
                return resp

        # 2. Hybrid Retrieval strictly over eligible chunks
        retrieved_chunks = self.retriever.hybrid_search(
            course_id=course_id,
            query_text=question,
            lesson_id=lesson_id,
            current_time_seconds=current_time_seconds,
            top_k=3
        )

        # 3. Check for Abstention if completely unsupported or relevance is below threshold
        is_unsupported = False
        if not retrieved_chunks:
            is_unsupported = True
        else:
            top_c = retrieved_chunks[0]
            if top_c.get("bm25_score", 0) == 0 and top_c.get("semantic_similarity", 0) < 0.32:
                is_unsupported = True

        if is_unsupported:
            resp = {
                "answer": "I could not find information about this in the lecture or resources permitted up to your current learning position. Please continue watching or check if it's introduced in later modules.",
                "citations": [],
                "confidence": "none",
                "abstained": True,
                "spoiler_prevented": False,
                "context_timestamp_seconds": current_time_seconds,
                "provider": "evidence_gate"
            }
            self._save_chat_message(
                course_id=course_id,
                lesson_id=lesson_id,
                session_id=session_id,
                question=question,
                response=resp,
                current_time_seconds=current_time_seconds
            )
            return resp

        # 4. Generate grounded answer
        llm_result = self.llm.generate_grounded_answer(
            question=question,
            evidence_chunks=retrieved_chunks,
            intent=intent
        )

        # 5. Citation validation
        validated_citations = self._validate_citations(llm_result.get("citations", []), retrieved_chunks)

        resp = {
            "answer": llm_result.get("answer", ""),
            "citations": validated_citations,
            "confidence": llm_result.get("confidence", "high"),
            "abstained": llm_result.get("abstained", False),
            "spoiler_prevented": False,
            "context_timestamp_seconds": current_time_seconds,
            "provider": llm_result.get("provider", "local"),
            "evidence_strength": llm_result.get("evidence_strength", 0.0)
        }

        # 6. Persist to chat history
        self._save_chat_message(
            course_id=course_id,
            lesson_id=lesson_id,
            session_id=session_id,
            question=question,
            response=resp,
            current_time_seconds=current_time_seconds
        )

        return resp

    def _validate_citations(
        self,
        citations: List[Dict[str, Any]],
        retrieved_chunks: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Guarantees every returned citation corresponds to a genuine retrieved chunk.
        """
        valid = []
        for cit in citations:
            # Check matching excerpt or start_seconds or page
            matched = False
            for chunk in retrieved_chunks:
                if (cit.get("start_seconds") is not None and cit.get("start_seconds") == chunk.get("start_seconds")) or \
                   (cit.get("page_number") is not None and cit.get("page_number") == chunk.get("page_number")) or \
                   (cit.get("slide_number") is not None and cit.get("slide_number") == chunk.get("slide_number")):
                    matched = True
                    break
            if matched or not citations:
                valid.append(cit)

        # Fallback to retrieved chunks if none validated
        if not valid and retrieved_chunks:
            c = retrieved_chunks[0]
            valid.append({
                "source_type": c.get("resource_type", "video"),
                "source_name": c.get("source_name", "Lesson Source"),
                "start_seconds": c.get("start_seconds"),
                "end_seconds": c.get("end_seconds"),
                "page_number": c.get("page_number"),
                "slide_number": c.get("slide_number"),
                "excerpt": c.get("text", "")[:240]
            })

        return valid

    def _save_chat_message(
        self,
        course_id: str,
        lesson_id: Optional[str],
        session_id: Optional[str],
        question: str,
        response: Dict[str, Any],
        current_time_seconds: Optional[float]
    ):
        try:
            # Save user message
            user_msg = ChatMessage(
                id=str(uuid.uuid4()),
                session_id=session_id,
                course_id=course_id,
                lesson_id=lesson_id,
                sender="user",
                message=question,
                timestamp_context_seconds=current_time_seconds,
                confidence="high",
                abstained=False,
                spoiler_prevented=False
            )
            # Save assistant message
            assistant_msg = ChatMessage(
                id=str(uuid.uuid4()),
                session_id=session_id,
                course_id=course_id,
                lesson_id=lesson_id,
                sender="assistant",
                message=response["answer"],
                timestamp_context_seconds=current_time_seconds,
                citations=response.get("citations", []),
                confidence=response.get("confidence", "high"),
                abstained=response.get("abstained", False),
                spoiler_prevented=response.get("spoiler_prevented", False)
            )
            self.db.add(user_msg)
            self.db.add(assistant_msg)
            self.db.commit()
        except Exception as e:
            logger.error(f"Failed to persist chat messages: {e}")
            self.db.rollback()
