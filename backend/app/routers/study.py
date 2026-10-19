from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import QuizAttempt
from app.services.summary_service import SummaryService
from app.services.comparison_service import ComparisonService
from app.services.quiz_service import QuizService

router = APIRouter(prefix="/api", tags=["Study Tools: Summaries, Quizzes & Comparison"])


class SummaryRequest(BaseModel):
    course_id: str
    lesson_id: Optional[str] = None
    current_time_seconds: float = Field(..., description="Playback timestamp up to which summary is generated")


class CompareRequest(BaseModel):
    course_id: str
    lesson_id: Optional[str] = None
    concept_a: str
    concept_b: str
    current_time_seconds: float = Field(..., description="Playback timestamp restricting evidence")


class QuizGenerateRequest(BaseModel):
    course_id: str
    lesson_id: Optional[str] = None
    current_time_seconds: float = Field(..., description="Playback timestamp for eligible quiz content")
    num_questions: int = Field(3, ge=1, le=10)


class QuizSubmitRequest(BaseModel):
    course_id: str
    lesson_id: Optional[str] = None
    timestamp_context_seconds: float
    questions_data: List[Dict[str, Any]]
    user_answers: Dict[str, int]


@router.post("/summary")
def get_summary(payload: SummaryRequest, db: Session = Depends(get_db)):
    service = SummaryService(db)
    return service.generate_summary(
        course_id=payload.course_id,
        lesson_id=payload.lesson_id,
        current_time_seconds=payload.current_time_seconds
    )


@router.post("/compare")
def compare_concepts(payload: CompareRequest, db: Session = Depends(get_db)):
    service = ComparisonService(db)
    return service.compare_concepts(
        course_id=payload.course_id,
        lesson_id=payload.lesson_id,
        concept_a=payload.concept_a,
        concept_b=payload.concept_b,
        current_time_seconds=payload.current_time_seconds
    )


@router.post("/quiz/generate")
def generate_quiz(payload: QuizGenerateRequest, db: Session = Depends(get_db)):
    service = QuizService(db)
    return service.generate_quiz(
        course_id=payload.course_id,
        lesson_id=payload.lesson_id,
        current_time_seconds=payload.current_time_seconds,
        num_questions=payload.num_questions
    )


@router.post("/quiz/submit")
def submit_quiz(payload: QuizSubmitRequest, db: Session = Depends(get_db)):
    service = QuizService(db)
    return service.submit_quiz(
        course_id=payload.course_id,
        lesson_id=payload.lesson_id,
        timestamp_context_seconds=payload.timestamp_context_seconds,
        questions_data=payload.questions_data,
        user_answers=payload.user_answers
    )


@router.get("/quiz/attempts")
def get_quiz_attempts(course_id: str, db: Session = Depends(get_db)):
    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.course_id == course_id
    ).order_by(QuizAttempt.created_at.desc()).limit(10).all()

    return [
        {
            "id": a.id,
            "course_id": a.course_id,
            "lesson_id": a.lesson_id,
            "score": a.score,
            "total_questions": a.total_questions,
            "timestamp_context_seconds": a.timestamp_context_seconds,
            "created_at": a.created_at.isoformat()
        }
        for a in attempts
    ]
