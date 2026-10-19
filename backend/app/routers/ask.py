from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import ChatMessage
from app.services.tutor_service import TutorService

router = APIRouter(prefix="/api", tags=["Ask AI & Doubt Solving"])


class AskRequest(BaseModel):
    course_id: str = Field(..., description="Target course ID")
    lesson_id: Optional[str] = Field(None, description="Optional target lesson ID")
    question: str = Field(..., description="Student query or doubt")
    current_time_seconds: Optional[float] = Field(
        None,
        description="Current playback position in seconds (Strict timestamp gate)"
    )
    session_id: Optional[str] = Field(None, description="Learning session ID")


@router.post("/ask")
def ask_question(payload: AskRequest, db: Session = Depends(get_db)):
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    tutor = TutorService(db)
    response = tutor.ask(
        course_id=payload.course_id,
        question=payload.question,
        current_time_seconds=payload.current_time_seconds,
        lesson_id=payload.lesson_id,
        session_id=payload.session_id
    )
    return response


@router.get("/ask/history")
def get_chat_history(
    course_id: str,
    lesson_id: Optional[str] = None,
    session_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ChatMessage).filter(ChatMessage.course_id == course_id)
    if lesson_id:
        query = query.filter(ChatMessage.lesson_id == lesson_id)
    if session_id:
        query = query.filter(ChatMessage.session_id == session_id)

    messages = query.order_by(ChatMessage.created_at.asc()).limit(50).all()

    return [
        {
            "id": m.id,
            "sender": m.sender,
            "message": m.message,
            "timestamp_context_seconds": m.timestamp_context_seconds,
            "citations": m.citations or [],
            "confidence": m.confidence,
            "abstained": m.abstained,
            "spoiler_prevented": m.spoiler_prevented,
            "created_at": m.created_at.isoformat()
        }
        for m in messages
    ]
