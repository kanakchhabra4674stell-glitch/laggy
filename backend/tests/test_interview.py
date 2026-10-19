import pytest
from app.services.interview_service import InterviewService


def test_interview_lifecycle_and_adaptive_follow_up(db_session):
    service = InterviewService(db_session)

    # 1. Start session
    session_data = service.start_session(
        role_target="Senior ML Systems Engineer",
        interview_type="technical",
        difficulty="advanced",
        total_questions=3,
        resume_text="Extensive experience in distributed PyTorch and model deployment.",
        job_description="Architect fault-tolerant deep learning training clusters."
    )

    session_id = session_data["session_id"]
    assert session_id is not None
    assert session_data["current_question_index"] == 1
    assert len(session_data["question"]) > 10

    # 2. Candidate answers question with brief answer that triggers a follow-up
    ans_1 = "I use gradient accumulation and mixed precision FP16."
    step_2 = service.submit_answer(session_id, ans_1)

    assert step_2["completed"] is False
    assert step_2["current_question_index"] == 2
    # The next question should be generated adaptively
    assert len(step_2["question"]) > 10

    # 3. Answer remaining questions to complete session
    ans_2 = "Specifically, we monitor GPU memory saturation using PyTorch profiler and add gradient clipping at max norm 1.0 to stabilize backward passes."
    step_3 = service.submit_answer(session_id, ans_2)

    ans_3 = "For CI/CD, we run automated regression evaluation on held-out benchmark splits and verify latency targets before deploying to the Triton cluster."
    final_step = service.submit_answer(session_id, ans_3)

    assert final_step["completed"] is True
    assert final_step["report_ready"] is True

    # 4. Fetch persisted report
    report = service.get_report(session_id)
    assert report is not None
    assert report["overall_score"] >= 0.0
    assert report["technical_score"] >= 0.0
    assert "rubric_breakdown" in report
    assert len(report["strengths"]) > 0
    assert len(report["improvements"]) > 0
    assert len(report["recommendations"]) > 0
    assert len(report["detailed_qa_feedback"]) == 3
