import pytest
from app.services.retrieval import TimestampGatedRetriever
from app.services.tutor_service import TutorService
from app.services.summary_service import SummaryService
from app.services.quiz_service import QuizService


def test_timestamp_gate_pre_filtering(db_session):
    retriever = TimestampGatedRetriever(db_session)
    course_id = "ml-fundamentals"

    # At 120s (2 minutes), only segments with end_seconds <= 120 should be eligible
    eligible_120 = retriever.get_eligible_chunks(course_id, "lesson-1-deep-learning", current_time_seconds=120.0)
    video_chunks_120 = [c for c in eligible_120 if c.resource_type == "video_transcript"]
    
    assert len(video_chunks_120) > 0
    for chunk in video_chunks_120:
        assert chunk.end_seconds <= 120.0, f"Leaked future chunk with end_seconds={chunk.end_seconds}"

    # At 500s, more segments should be eligible
    eligible_500 = retriever.get_eligible_chunks(course_id, "lesson-1-deep-learning", current_time_seconds=500.0)
    video_chunks_500 = [c for c in eligible_500 if c.resource_type == "video_transcript"]
    assert len(video_chunks_500) > len(video_chunks_120)


def test_future_concept_question_spoiler_safe_abstention(db_session):
    tutor = TutorService(db_session)
    course_id = "ml-fundamentals"

    # Backpropagation appears in the transcript around 360s - 540s (06:00 - 09:00)
    # If the user asks at 120s (02:00), it MUST be prevented from answering
    response_early = tutor.ask(
        course_id=course_id,
        lesson_id="lesson-1-deep-learning",
        question="How does backpropagation and the chain rule calculate gradients?",
        current_time_seconds=120.0
    )

    assert response_early["abstained"] is True
    assert response_early["spoiler_prevented"] is True
    assert "appears later in the lesson" in response_early["answer"].lower()
    # Ensure no future video citations were returned
    for cit in response_early.get("citations", []):
        if cit.get("start_seconds") is not None:
            assert cit["start_seconds"] <= 120.0


def test_concept_answerable_once_timestamp_passed(db_session):
    tutor = TutorService(db_session)
    course_id = "ml-fundamentals"

    # At 500s (08:20), backpropagation has been introduced and should be answerable
    response_late = tutor.ask(
        course_id=course_id,
        lesson_id="lesson-1-deep-learning",
        question="What is backpropagation?",
        current_time_seconds=500.0
    )

    assert response_late["abstained"] is False
    assert len(response_late["citations"]) > 0
    assert any("backpropagation" in c["excerpt"].lower() for c in response_late["citations"])


def test_summary_obeys_timestamp_gate(db_session):
    summary_service = SummaryService(db_session)
    course_id = "ml-fundamentals"

    # Summary at 120s
    res_120 = summary_service.generate_summary(
        course_id=course_id,
        lesson_id="lesson-1-deep-learning",
        current_time_seconds=120.0
    )
    summary_text = res_120["summary"].lower()
    assert "backpropagation" not in summary_text
    assert "dropout" not in summary_text
    assert len(res_120["key_takeaways"]) > 0


def test_quiz_obeys_timestamp_gate(db_session):
    quiz_service = QuizService(db_session)
    course_id = "ml-fundamentals"

    # Quiz generated at 100s
    res = quiz_service.generate_quiz(
        course_id=course_id,
        lesson_id="lesson-1-deep-learning",
        current_time_seconds=100.0,
        num_questions=2
    )

    for q in res["questions"]:
        cit = q.get("citation")
        if cit and cit.get("end_seconds") is not None:
            assert cit["end_seconds"] <= 100.0
