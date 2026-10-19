import uuid
import json
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.db.models import QuizAttempt
from app.services.retrieval import TimestampGatedRetriever
from app.services.llm_adapter import LLMAdapter

logger = logging.getLogger(__name__)


class QuizService:
    def __init__(self, db: Session):
        self.db = db
        self.retriever = TimestampGatedRetriever(db)
        self.llm = LLMAdapter()

    def generate_quiz(
        self,
        course_id: str,
        lesson_id: Optional[str],
        current_time_seconds: float,
        num_questions: int = 3
    ) -> Dict[str, Any]:
        """
        Generates multiple-choice questions strictly from covered chunks.
        """
        eligible = self.retriever.get_eligible_chunks(course_id, lesson_id, current_time_seconds)
        if not eligible or len(eligible) < 1:
            return {
                "quiz_id": str(uuid.uuid4()),
                "questions": [],
                "message": "Not enough content has been covered yet to generate a quiz. Watch a few minutes of the lesson first!",
                "context_timestamp_seconds": current_time_seconds
            }

        # Select representative chunks
        sample_chunks = eligible[:min(num_questions * 2, len(eligible))]

        # If Gemini is active, use Gemini for diverse question generation
        if self.llm.is_gemini_active:
            try:
                context_str = "\n".join([f"- {c.text}" for c in sample_chunks])
                prompt = f"""
Generate {num_questions} multiple-choice quiz questions based STRICTLY on this covered content:
{context_str}

Return JSON with this exact structure:
[
  {{
    "question": "Clear question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_index": 0,
    "explanation": "Why this option is correct based on covered material."
  }}
]
"""
                resp = self.llm.client.models.generate_content(
                    model=self.llm.model_name,
                    contents=prompt,
                    config={
                        "temperature": 0.2,
                        "response_mime_type": "application/json"
                    }
                )
                generated_q = json.loads(resp.text)
                formatted_questions = []
                for idx, q in enumerate(generated_q[:num_questions]):
                    c = sample_chunks[min(idx, len(sample_chunks) - 1)]
                    formatted_questions.append({
                        "id": f"q_{idx+1}",
                        "question": q["question"],
                        "options": q["options"],
                        "correct_index": q.get("correct_index", 0),
                        "explanation": q.get("explanation", ""),
                        "citation": {
                            "source_name": c.lesson.title if c.lesson else "Lecture Content",
                            "start_seconds": c.start_seconds,
                            "end_seconds": c.end_seconds,
                            "page_number": c.page_number,
                            "excerpt": c.text[:180]
                        }
                    })
                return {
                    "quiz_id": str(uuid.uuid4()),
                    "questions": formatted_questions,
                    "context_timestamp_seconds": current_time_seconds
                }
            except Exception as e:
                logger.error(f"Gemini quiz generation failed: {e}. Falling back to deterministic generator.")

        # Deterministic Grounded Quiz Generator (Fallback & Offline)
        questions = []
        for idx, chunk in enumerate(sample_chunks[:num_questions]):
            snippet = chunk.text.strip()
            # Formulate question based on chunk text
            words = snippet.split()
            first_sentence = snippet.split(".")[0].strip()

            q_text = f"According to the lecture covered up to this timestamp, what is key regarding: {first_sentence[:80]}...?"
            options = [
                f"{first_sentence[:90]}.",
                "It is strictly used for unrelated database queries.",
                "It requires bypassing all weight updates completely.",
                "It guarantees zero gradient magnitude unconditionally."
            ]
            questions.append({
                "id": f"q_{idx+1}",
                "question": q_text,
                "options": options,
                "correct_index": 0,
                "explanation": f"Grounded directly in covered lecture context: \"{first_sentence}\"",
                "citation": {
                    "source_name": chunk.lesson.title if chunk.lesson else "Lecture Note",
                    "start_seconds": chunk.start_seconds,
                    "end_seconds": chunk.end_seconds,
                    "page_number": chunk.page_number,
                    "slide_number": chunk.slide_number,
                    "excerpt": snippet[:200]
                }
            })

        return {
            "quiz_id": str(uuid.uuid4()),
            "questions": questions,
            "context_timestamp_seconds": current_time_seconds
        }

    def submit_quiz(
        self,
        course_id: str,
        lesson_id: Optional[str],
        timestamp_context_seconds: float,
        questions_data: List[Dict[str, Any]],
        user_answers: Dict[str, int]
    ) -> Dict[str, Any]:
        """
        Scores quiz submission, explains each question, and persists attempt.
        """
        score = 0
        total = len(questions_data)
        evaluations = []

        for q in questions_data:
            q_id = q["id"]
            user_choice = user_answers.get(q_id)
            correct_idx = q.get("correct_index", 0)
            is_correct = (user_choice == correct_idx)
            if is_correct:
                score += 1

            evaluations.append({
                "question_id": q_id,
                "question": q["question"],
                "user_choice": user_choice,
                "correct_index": correct_idx,
                "is_correct": is_correct,
                "explanation": q.get("explanation", ""),
                "citation": q.get("citation")
            })

        percentage = round((score / max(total, 1)) * 100, 1)

        # Persist attempt
        attempt = QuizAttempt(
            id=str(uuid.uuid4()),
            course_id=course_id,
            lesson_id=lesson_id,
            timestamp_context_seconds=timestamp_context_seconds,
            score=percentage,
            total_questions=total,
            questions_data=questions_data,
            user_answers=user_answers,
            explanations=evaluations
        )
        try:
            self.db.add(attempt)
            self.db.commit()
        except Exception as e:
            logger.error(f"Failed to persist quiz attempt: {e}")
            self.db.rollback()

        return {
            "attempt_id": attempt.id,
            "score": score,
            "total_questions": total,
            "percentage": percentage,
            "evaluations": evaluations
        }
