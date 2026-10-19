import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Course, Lesson, TranscriptSegment, Resource, LearningSession, QuizAttempt, InterviewSession, ChatMessage

router = APIRouter(prefix="/api", tags=["Courses & Lessons"])


class CourseCreate(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    instructor: Optional[str] = "Prof. Elena Vance"
    thumbnail_url: Optional[str] = None


class LessonCreate(BaseModel):
    id: Optional[str] = None
    course_id: str
    title: str
    description: Optional[str] = None
    duration_seconds: float = 0.0
    video_url: Optional[str] = None
    order_index: int = 1


@router.get("/courses")
def list_courses(db: Session = Depends(get_db)):
    courses = db.query(Course).all()
    results = []
    for c in courses:
        results.append({
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "instructor": c.instructor,
            "thumbnail_url": c.thumbnail_url,
            "lesson_count": len(c.lessons),
            "resource_count": len(c.resources),
            "created_at": c.created_at.isoformat()
        })
    return results


@router.post("/courses")
def create_course(payload: CourseCreate, db: Session = Depends(get_db)):
    course_id = payload.id or str(uuid.uuid4())[:8]
    course = Course(
        id=course_id,
        title=payload.title,
        description=payload.description,
        instructor=payload.instructor,
        thumbnail_url=payload.thumbnail_url
    )
    db.add(course)
    db.commit()
    return {"id": course.id, "title": course.title, "message": "Course created successfully"}


@router.get("/courses/{course_id}")
def get_course_details(course_id: str, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    lessons_data = []
    for l in course.lessons:
        # Fetch transcript segments ordered by start_seconds
        segments = db.query(TranscriptSegment).filter(
            TranscriptSegment.lesson_id == l.id
        ).order_by(TranscriptSegment.start_seconds).all()

        lessons_data.append({
            "id": l.id,
            "title": l.title,
            "description": l.description,
            "duration_seconds": l.duration_seconds,
            "video_url": l.video_url,
            "order_index": l.order_index,
            "segments_count": len(segments),
            "transcript_segments": [
                {
                    "id": s.id,
                    "start_seconds": s.start_seconds,
                    "end_seconds": s.end_seconds,
                    "text": s.text
                }
                for s in segments
            ]
        })

    resources_data = [
        {
            "id": r.id,
            "title": r.title,
            "file_type": r.file_type,
            "file_size": r.file_size,
            "status": r.status,
            "unlock_timestamp_seconds": r.unlock_timestamp_seconds
        }
        for r in course.resources
    ]

    return {
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "instructor": course.instructor,
        "thumbnail_url": course.thumbnail_url,
        "lessons": lessons_data,
        "resources": resources_data
    }


@router.post("/lessons")
def create_lesson(payload: LessonCreate, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == payload.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Parent course not found")

    lesson_id = payload.id or str(uuid.uuid4())[:8]
    lesson = Lesson(
        id=lesson_id,
        course_id=payload.course_id,
        title=payload.title,
        description=payload.description,
        duration_seconds=payload.duration_seconds,
        video_url=payload.video_url,
        order_index=payload.order_index
    )
    db.add(lesson)
    db.commit()
    return {"id": lesson.id, "title": lesson.title, "message": "Lesson created successfully"}


@router.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    courses_count = db.query(Course).count()
    sessions = db.query(LearningSession).all()
    total_time_studied = sum(s.time_studied_seconds for s in sessions)
    
    # Recent quiz attempts
    recent_quizzes = db.query(QuizAttempt).order_by(QuizAttempt.created_at.desc()).limit(5).all()
    quizzes_data = [
        {
            "id": q.id,
            "course_id": q.course_id,
            "score": q.score,
            "total_questions": q.total_questions,
            "created_at": q.created_at.isoformat()
        }
        for q in recent_quizzes
    ]

    # Recent chat messages / questions
    recent_questions = db.query(ChatMessage).filter(ChatMessage.sender == "user").order_by(ChatMessage.created_at.desc()).limit(5).all()
    questions_data = [
        {
            "id": q.id,
            "question": q.message,
            "timestamp_context": q.timestamp_context_seconds,
            "created_at": q.created_at.isoformat()
        }
        for q in recent_questions
    ]

    # Recent interviews
    recent_interviews = db.query(InterviewSession).order_by(InterviewSession.created_at.desc()).limit(5).all()
    interviews_data = []
    for i in recent_interviews:
        interviews_data.append({
            "id": i.id,
            "role_target": i.role_target,
            "interview_type": i.interview_type,
            "difficulty": i.difficulty,
            "status": i.status,
            "overall_score": i.report.overall_score if i.report else None,
            "created_at": i.created_at.isoformat()
        })

    return {
        "courses_enrolled": courses_count,
        "total_time_studied_seconds": round(total_time_studied, 0),
        "recent_quizzes": quizzes_data,
        "recent_questions": questions_data,
        "recent_interviews": interviews_data
    }
