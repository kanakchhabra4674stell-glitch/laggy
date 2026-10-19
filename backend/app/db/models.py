from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
    JSON,
    Index
)
from sqlalchemy.orm import relationship
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    email = Column(String(128), unique=True, nullable=False)
    role = Column(String(64), default="learner")
    created_at = Column(DateTime, default=datetime.utcnow)

    sessions = relationship("LearningSession", back_populates="user", cascade="all, delete-orphan")


class Course(Base):
    __tablename__ = "courses"

    id = Column(String(64), primary_key=True)
    title = Column(String(256), nullable=False)
    description = Column(Text, nullable=False)
    instructor = Column(String(128), default="Prof. Elena Vance")
    thumbnail_url = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    lessons = relationship("Lesson", back_populates="course", cascade="all, delete-orphan", order_by="Lesson.order_index")
    resources = relationship("Resource", back_populates="course", cascade="all, delete-orphan")
    chunks = relationship("DocumentChunk", back_populates="course", cascade="all, delete-orphan")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(String(64), primary_key=True)
    course_id = Column(String(64), ForeignKey("courses.id"), nullable=False, index=True)
    title = Column(String(256), nullable=False)
    description = Column(Text, nullable=True)
    duration_seconds = Column(Float, default=0.0)
    video_url = Column(String(512), nullable=True)
    order_index = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    course = relationship("Course", back_populates="lessons")
    video_metadata = relationship("VideoMetadata", uselist=False, back_populates="lesson", cascade="all, delete-orphan")
    transcript_segments = relationship(
        "TranscriptSegment",
        back_populates="lesson",
        cascade="all, delete-orphan",
        order_by="TranscriptSegment.start_seconds"
    )
    chunks = relationship("DocumentChunk", back_populates="lesson", cascade="all, delete-orphan")


class VideoMetadata(Base):
    __tablename__ = "video_metadata"

    id = Column(String(64), primary_key=True)
    lesson_id = Column(String(64), ForeignKey("lessons.id"), nullable=False, unique=True)
    filename = Column(String(256), nullable=False)
    duration_seconds = Column(Float, default=0.0)
    resolution = Column(String(64), default="1080p")
    mime_type = Column(String(64), default="video/mp4")
    created_at = Column(DateTime, default=datetime.utcnow)

    lesson = relationship("Lesson", back_populates="video_metadata")


class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"

    id = Column(String(64), primary_key=True)
    lesson_id = Column(String(64), ForeignKey("lessons.id"), nullable=False, index=True)
    start_seconds = Column(Float, nullable=False, index=True)
    end_seconds = Column(Float, nullable=False, index=True)
    text = Column(Text, nullable=False)
    source_id = Column(String(128), default="primary_transcript")
    created_at = Column(DateTime, default=datetime.utcnow)

    lesson = relationship("Lesson", back_populates="transcript_segments")

    __table_args__ = (
        Index("idx_segment_lesson_end", "lesson_id", "end_seconds"),
    )


class Resource(Base):
    __tablename__ = "resources"

    id = Column(String(64), primary_key=True)
    course_id = Column(String(64), ForeignKey("courses.id"), nullable=False, index=True)
    lesson_id = Column(String(64), ForeignKey("lessons.id"), nullable=True, index=True)
    title = Column(String(256), nullable=False)
    file_type = Column(String(32), nullable=False)  # 'pdf', 'pptx', 'txt', 'md', 'docx', 'transcript'
    file_path = Column(String(512), nullable=False)
    file_size = Column(Integer, default=0)
    status = Column(String(32), default="pending")  # 'pending', 'processing', 'completed', 'failed'
    error_message = Column(Text, nullable=True)
    unlock_timestamp_seconds = Column(Float, nullable=True)  # None means unrestricted
    created_at = Column(DateTime, default=datetime.utcnow)

    course = relationship("Course", back_populates="resources")
    chunks = relationship("DocumentChunk", back_populates="resource", cascade="all, delete-orphan")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String(64), primary_key=True)
    course_id = Column(String(64), ForeignKey("courses.id"), nullable=False, index=True)
    lesson_id = Column(String(64), ForeignKey("lessons.id"), nullable=True, index=True)
    resource_id = Column(String(64), ForeignKey("resources.id"), nullable=True, index=True)
    resource_type = Column(String(32), nullable=False)  # 'video_transcript', 'pdf', 'pptx', 'text', 'notes'
    chunk_index = Column(Integer, default=0)
    text = Column(Text, nullable=False)
    start_seconds = Column(Float, nullable=True)
    end_seconds = Column(Float, nullable=True, index=True)
    page_number = Column(Integer, nullable=True)
    slide_number = Column(Integer, nullable=True)
    unlock_timestamp_seconds = Column(Float, nullable=True)
    embedding_vector = Column(JSON, nullable=True)  # Stored as float array
    created_at = Column(DateTime, default=datetime.utcnow)

    course = relationship("Course", back_populates="chunks")
    lesson = relationship("Lesson", back_populates="chunks")
    resource = relationship("Resource", back_populates="chunks")

    __table_args__ = (
        Index("idx_chunk_lesson_end", "lesson_id", "end_seconds"),
        Index("idx_chunk_course_type", "course_id", "resource_type"),
    )


class LearningSession(Base):
    __tablename__ = "learning_sessions"

    id = Column(String(64), primary_key=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    course_id = Column(String(64), ForeignKey("courses.id"), nullable=False, index=True)
    lesson_id = Column(String(64), ForeignKey("lessons.id"), nullable=False, index=True)
    last_timestamp_seconds = Column(Float, default=0.0)
    time_studied_seconds = Column(Float, default=0.0)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="sessions")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String(64), primary_key=True)
    session_id = Column(String(64), nullable=True, index=True)
    course_id = Column(String(64), ForeignKey("courses.id"), nullable=False, index=True)
    lesson_id = Column(String(64), ForeignKey("lessons.id"), nullable=True, index=True)
    sender = Column(String(32), nullable=False)  # 'user', 'assistant'
    message = Column(Text, nullable=False)
    timestamp_context_seconds = Column(Float, nullable=True)
    citations = Column(JSON, nullable=True)  # List of citation dicts
    confidence = Column(String(32), default="high")  # 'high', 'medium', 'low', 'none'
    abstained = Column(Boolean, default=False)
    spoiler_prevented = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(String(64), primary_key=True)
    course_id = Column(String(64), ForeignKey("courses.id"), nullable=False, index=True)
    lesson_id = Column(String(64), ForeignKey("lessons.id"), nullable=True, index=True)
    timestamp_context_seconds = Column(Float, nullable=False)
    score = Column(Float, default=0.0)
    total_questions = Column(Integer, default=0)
    questions_data = Column(JSON, nullable=False)  # Array of question dicts with options
    user_answers = Column(JSON, nullable=True)     # Array or dict of submitted answers
    explanations = Column(JSON, nullable=True)     # Citations and explanations
    created_at = Column(DateTime, default=datetime.utcnow)


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(String(64), primary_key=True)
    role_target = Column(String(128), nullable=False)
    interview_type = Column(String(64), default="mixed")  # 'technical', 'behavioral', 'hr', 'mixed'
    difficulty = Column(String(32), default="intermediate")  # 'beginner', 'intermediate', 'advanced'
    total_questions = Column(Integer, default=5)
    current_question_index = Column(Integer, default=0)
    status = Column(String(32), default="in_progress")  # 'in_progress', 'completed'
    course_id = Column(String(64), ForeignKey("courses.id"), nullable=True)
    resume_text = Column(Text, nullable=True)
    job_description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    qa_items = relationship(
        "InterviewQA",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="InterviewQA.question_index"
    )
    report = relationship("InterviewReport", uselist=False, back_populates="session", cascade="all, delete-orphan")


class InterviewQA(Base):
    __tablename__ = "interview_qa"

    id = Column(String(64), primary_key=True)
    session_id = Column(String(64), ForeignKey("interview_sessions.id"), nullable=False, index=True)
    question_index = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    candidate_answer = Column(Text, nullable=True)
    evaluation_notes = Column(Text, nullable=True)
    score = Column(Float, nullable=True)
    follow_up_reason = Column(Text, nullable=True)
    is_follow_up = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("InterviewSession", back_populates="qa_items")


class InterviewReport(Base):
    __tablename__ = "interview_reports"

    id = Column(String(64), primary_key=True)
    session_id = Column(String(64), ForeignKey("interview_sessions.id"), nullable=False, unique=True)
    overall_score = Column(Float, nullable=False)
    technical_score = Column(Float, nullable=False)
    communication_score = Column(Float, nullable=False)
    problem_solving_score = Column(Float, nullable=False)
    structure_relevance_score = Column(Float, nullable=False)
    strengths = Column(JSON, nullable=False)
    improvements = Column(JSON, nullable=False)
    rubric_breakdown = Column(JSON, nullable=False)
    detailed_qa_feedback = Column(JSON, nullable=False)
    recommendations = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("InterviewSession", back_populates="report")
