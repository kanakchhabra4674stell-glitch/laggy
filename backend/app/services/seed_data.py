import os
import uuid
import logging
from sqlalchemy.orm import Session
from app.db.models import (
    User,
    Course,
    Lesson,
    VideoMetadata,
    TranscriptSegment,
    Resource,
    DocumentChunk,
    LearningSession,
    QuizAttempt,
    InterviewSession,
    InterviewQA,
    InterviewReport
)
from app.services.parser import parse_vtt_or_srt, parse_pdf, parse_pptx, parse_text_file
from app.services.embeddings import compute_embeddings
from app.config import settings

logger = logging.getLogger(__name__)


def seed_database(db: Session):
    """
    Seeds initial demo course, lessons, transcripts, documents, and embeddings.
    Idempotent: skips if course already exists.
    """
    existing_course = db.query(Course).filter(Course.id == "ml-fundamentals").first()
    if existing_course:
        logger.info("Database already seeded with demo course.")
        return

    logger.info("Seeding database with demo course and multimodal learning context...")

    # 1. Create Demo User
    user = User(
        id="demo-learner-1",
        name="Alex Rivera",
        email="alex.rivera@example.com",
        role="learner"
    )
    db.add(user)

    # 2. Create Demo Course
    course = Course(
        id="ml-fundamentals",
        title="Machine Learning Fundamentals: Neural Networks & Optimization",
        description="Comprehensive masterclass exploring perceptrons, loss surfaces, gradient descent, non-linear activation functions, backpropagation dynamics, and regularization.",
        instructor="Prof. Elena Vance, PhD",
        thumbnail_url="/images/course_thumb.png"
    )
    db.add(course)

    # 3. Create Lesson 1
    video_relative_url = "/videos/lecture.mp4"
    lesson = Lesson(
        id="lesson-1-deep-learning",
        course_id=course.id,
        title="Lecture 1: Neural Networks, Gradients & Backpropagation",
        description="Foundational breakdown of artificial neurons, objective functions, activation behavior, and backward gradient computation.",
        duration_seconds=630.0,
        video_url=video_relative_url,
        order_index=1
    )
    db.add(lesson)

    # Video Metadata
    v_meta = VideoMetadata(
        id=str(uuid.uuid4()),
        lesson_id=lesson.id,
        filename="lecture.mp4",
        duration_seconds=630.0,
        resolution="1080p",
        mime_type="video/mp4"
    )
    db.add(v_meta)
    db.commit()

    # 4. Parse & Ingest Transcript Segments
    transcript_path = os.path.join(settings.DATA_DIR, "sample_transcript.vtt")
    if os.path.exists(transcript_path):
        vtt_content = parse_text_file(transcript_path)
        raw_segments = parse_vtt_or_srt(vtt_content)
    else:
        raw_segments = []

    transcript_texts = [s["text"] for s in raw_segments]
    transcript_vectors = compute_embeddings(transcript_texts)

    for idx, seg in enumerate(raw_segments):
        # Save transcript segment
        t_segment = TranscriptSegment(
            id=str(uuid.uuid4()),
            lesson_id=lesson.id,
            start_seconds=seg["start_seconds"],
            end_seconds=seg["end_seconds"],
            text=seg["text"],
            source_id="vtt_master"
        )
        db.add(t_segment)

        # Save as document chunk for hybrid RAG
        chunk = DocumentChunk(
            id=str(uuid.uuid4()),
            course_id=course.id,
            lesson_id=lesson.id,
            resource_id=None,
            resource_type="video_transcript",
            chunk_index=idx,
            text=seg["text"],
            start_seconds=seg["start_seconds"],
            end_seconds=seg["end_seconds"],
            page_number=None,
            slide_number=None,
            unlock_timestamp_seconds=None,
            embedding_vector=transcript_vectors[idx] if idx < len(transcript_vectors) else None
        )
        db.add(chunk)

    db.commit()

    # 5. Ingest Supporting PDF Guide with Timeline Mappings (Module 1: 0s, Module 2: 135s, Module 3 Backprop: 360s)
    pdf_path = os.path.join(settings.DATA_DIR, "sample_guide.pdf")
    if os.path.exists(pdf_path):
        pdf_res = Resource(
            id="res-guide-pdf",
            course_id=course.id,
            lesson_id=lesson.id,
            title="Neural Networks & Optimization Comprehensive Guide",
            file_type="pdf",
            file_path=pdf_path,
            file_size=os.path.getsize(pdf_path),
            status="completed",
            unlock_timestamp_seconds=None
        )
        db.add(pdf_res)
        db.commit()

        pdf_pages = parse_pdf(pdf_path)
        pdf_texts = [p["text"] for p in pdf_pages]
        pdf_vectors = compute_embeddings(pdf_texts)

        # Timeline unlocks per page: Page 1: 0s, Page 2: 135s, Page 3: 360s
        page_unlocks = {1: 0.0, 2: 135.0, 3: 360.0}

        for p_idx, page in enumerate(pdf_pages):
            p_num = page["page_number"]
            db.add(DocumentChunk(
                id=str(uuid.uuid4()),
                course_id=course.id,
                lesson_id=lesson.id,
                resource_id=pdf_res.id,
                resource_type="pdf",
                chunk_index=p_idx,
                text=page["text"],
                start_seconds=None,
                end_seconds=None,
                page_number=p_num,
                slide_number=None,
                unlock_timestamp_seconds=page_unlocks.get(p_num, None),
                embedding_vector=pdf_vectors[p_idx] if p_idx < len(pdf_vectors) else None
            ))
        db.commit()

    # 6. Ingest Supporting PPTX Presentation with Timeline Mappings (Slide 1: 0s, Slide 2: 135s, Slide 3: 285s, Slide 4: 360s)
    pptx_path = os.path.join(settings.DATA_DIR, "sample_slides.pptx")
    if os.path.exists(pptx_path):
        pptx_res = Resource(
            id="res-slides-pptx",
            course_id=course.id,
            lesson_id=lesson.id,
            title="Lecture Slides: Foundations & Optimization",
            file_type="pptx",
            file_path=pptx_path,
            file_size=os.path.getsize(pptx_path),
            status="completed",
            unlock_timestamp_seconds=None
        )
        db.add(pptx_res)
        db.commit()

        slides = parse_pptx(pptx_path)
        slide_texts = [s["text"] for s in slides]
        slide_vectors = compute_embeddings(slide_texts)

        slide_unlocks = {1: 0.0, 2: 135.0, 3: 285.0, 4: 360.0}

        for s_idx, slide in enumerate(slides):
            s_num = slide["slide_number"]
            db.add(DocumentChunk(
                id=str(uuid.uuid4()),
                course_id=course.id,
                lesson_id=lesson.id,
                resource_id=pptx_res.id,
                resource_type="pptx",
                chunk_index=s_idx,
                text=slide["text"],
                start_seconds=None,
                end_seconds=None,
                page_number=None,
                slide_number=s_num,
                unlock_timestamp_seconds=slide_unlocks.get(s_num, None),
                embedding_vector=slide_vectors[s_idx] if s_idx < len(slide_vectors) else None
            ))
        db.commit()

    # 7. Create Learning Session
    session = LearningSession(
        id="session-demo-1",
        user_id=user.id,
        course_id=course.id,
        lesson_id=lesson.id,
        last_timestamp_seconds=180.0,
        time_studied_seconds=1240.0,
        completed=False
    )
    db.add(session)

    # 8. Create Previous Quiz Attempt
    quiz_attempt = QuizAttempt(
        id="quiz-demo-1",
        course_id=course.id,
        lesson_id=lesson.id,
        timestamp_context_seconds=180.0,
        score=100.0,
        total_questions=2,
        questions_data=[
            {
                "id": "q_1",
                "question": "What is the mathematical formulation of an artificial neuron before activation?",
                "options": [
                    "z = W · X + b",
                    "z = W / X - b",
                    "z = W^2 + X^2",
                    "z = log(W) * exp(X)"
                ],
                "correct_index": 0
            }
        ],
        user_answers={"q_1": 0},
        explanations=[
            {
                "question_id": "q_1",
                "is_correct": True,
                "explanation": "An artificial neuron applies weights W and bias b: z = W · X + b."
            }
        ]
    )
    db.add(quiz_attempt)

    # 9. Create Seed Interview Session with Finished Report
    interview_session = InterviewSession(
        id="interview-demo-1",
        role_target="Senior Machine Learning Engineer",
        interview_type="technical",
        difficulty="intermediate",
        total_questions=3,
        current_question_index=3,
        status="completed",
        course_id=course.id,
        resume_text="Senior ML Engineer with expertise in RAG architectures and distributed PyTorch training.",
        job_description="Architect scalable vector search, optimize LLM inference pipelines, and implement resilient ML services."
    )
    db.add(interview_session)

    db.add(InterviewQA(
        id=str(uuid.uuid4()),
        session_id=interview_session.id,
        question_index=1,
        question_text="How do you architect a hybrid retrieval pipeline combining dense vector embeddings and sparse BM25 retrieval?",
        candidate_answer="We compute reciprocal rank fusion over dense cosine similarity scores and Okapi BM25 keyword matching, applying strict pre-filtering for metadata and timestamps before ranking.",
        evaluation_notes="Strong answer demonstrating practical knowledge of RRF ranking and indexing pre-filters.",
        score=92.0,
        is_follow_up=False
    ))

    db.add(InterviewReport(
        id="report-demo-1",
        session_id=interview_session.id,
        overall_score=89.5,
        technical_score=92.0,
        communication_score=88.0,
        problem_solving_score=90.0,
        structure_relevance_score=88.0,
        strengths=[
            "Deep comprehension of hybrid retrieval scoring mechanics and Reciprocal Rank Fusion.",
            "Clear technical explanations and accurate terminology.",
            "Systematic approach to handling ranking trade-offs."
        ],
        improvements=[
            "Quantify expected p99 latency SLAs in high-throughput retrieval pipelines.",
            "Discuss cold-start index warming and vector cache invalidation."
        ],
        rubric_breakdown={
            "Technical Knowledge": {"score": 92.0, "weight": "35%", "criteria": "Accuracy, depth of domain concepts, and architectural validity."},
            "Communication & Clarity": {"score": 88.0, "weight": "25%", "criteria": "Conciseness, terminology precision, and clear explanation."},
            "Problem Solving": {"score": 90.0, "weight": "25%", "criteria": "Analytical breakdown of trade-offs, edge cases, and constraints."},
            "Structure & Relevance": {"score": 88.0, "weight": "15%", "criteria": "Directly addressing the question prompt without unnecessary tangents."}
        },
        detailed_qa_feedback=[
            {
                "question_index": 1,
                "question": "How do you architect a hybrid retrieval pipeline combining dense vector embeddings and sparse BM25 retrieval?",
                "answer": "We compute reciprocal rank fusion over dense cosine similarity scores and Okapi BM25 keyword matching...",
                "score": 92.0,
                "evaluation_notes": "Strong answer demonstrating practical knowledge of RRF ranking."
            }
        ],
        recommendations=[
            "Review distributed vector search partitioning strategies (e.g., HNSW sharding).",
            "Prepare operational telemetry metrics for model drift and retrieval decay."
        ]
    ))

    db.commit()
    logger.info("Database seeding successfully completed!")
