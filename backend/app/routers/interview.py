from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import InterviewSession
from app.services.interview_service import InterviewService

router = APIRouter(prefix="/api/interview", tags=["AI Mock Interview"])


class StartInterviewRequest(BaseModel):
    role_target: str = Field(..., description="Target job title or role")
    interview_type: str = Field("mixed", description="technical | behavioral | hr | mixed")
    difficulty: str = Field("intermediate", description="beginner | intermediate | advanced")
    total_questions: int = Field(5, ge=1, le=15)
    course_id: Optional[str] = None
    resume_text: Optional[str] = None
    job_description: Optional[str] = None


class SubmitAnswerRequest(BaseModel):
    answer: str = Field(..., description="Candidate's text response")


@router.post("/start")
def start_interview(payload: StartInterviewRequest, db: Session = Depends(get_db)):
    service = InterviewService(db)
    return service.start_session(
        role_target=payload.role_target,
        interview_type=payload.interview_type,
        difficulty=payload.difficulty,
        total_questions=payload.total_questions,
        course_id=payload.course_id,
        resume_text=payload.resume_text,
        job_description=payload.job_description
    )


@router.post("/{session_id}/answer")
def submit_answer(
    session_id: str,
    payload: SubmitAnswerRequest,
    db: Session = Depends(get_db)
):
    service = InterviewService(db)
    try:
        return service.submit_answer(session_id=session_id, answer_text=payload.answer)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{session_id}/end")
def end_interview_early(session_id: str, db: Session = Depends(get_db)):
    service = InterviewService(db)
    try:
        return service.end_session_early(session_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{session_id}/report")
def get_interview_report(session_id: str, db: Session = Depends(get_db)):
    service = InterviewService(db)
    report = service.get_report(session_id)
    if not report:
        raise HTTPException(status_code=404, detail="Interview report not found or not yet generated.")
    return report


@router.get("/sessions")
def list_interview_sessions(db: Session = Depends(get_db)):
    sessions = db.query(InterviewSession).order_by(InterviewSession.created_at.desc()).limit(15).all()
    return [
        {
            "id": s.id,
            "role_target": s.role_target,
            "interview_type": s.interview_type,
            "difficulty": s.difficulty,
            "status": s.status,
            "total_questions": s.total_questions,
            "overall_score": s.report.overall_score if s.report else None,
            "created_at": s.created_at.isoformat()
        }
        for s in sessions
    ]
