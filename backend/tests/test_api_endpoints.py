import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import get_db


@pytest.fixture
def client(db_session):
    app.dependency_overrides[get_db] = lambda: db_session
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def test_api_health_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "ai_provider" in data
    assert "service" in data


def test_api_courses_endpoints(client):
    res = client.get("/api/courses")
    assert res.status_code == 200
    courses = res.json()
    assert len(courses) > 0
    assert any(c["id"] == "ml-fundamentals" for c in courses)

    detail_res = client.get("/api/courses/ml-fundamentals")
    assert detail_res.status_code == 200
    details = detail_res.json()
    assert len(details["lessons"]) > 0
    assert len(details["resources"]) > 0


def test_api_ask_endpoint(client):
    payload = {
        "course_id": "ml-fundamentals",
        "lesson_id": "lesson-1-deep-learning",
        "question": "What is an artificial neuron?",
        "current_time_seconds": 120.0
    }
    res = client.post("/api/ask", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "answer" in data
    assert "citations" in data
    assert data["context_timestamp_seconds"] == 120.0


def test_api_summary_and_quiz_endpoints(client):
    # Summary
    sum_res = client.post("/api/summary", json={
        "course_id": "ml-fundamentals",
        "lesson_id": "lesson-1-deep-learning",
        "current_time_seconds": 180.0
    })
    assert sum_res.status_code == 200
    sum_data = sum_res.json()
    assert "summary" in sum_data
    assert len(sum_data["key_takeaways"]) > 0

    # Quiz Generation
    quiz_res = client.post("/api/quiz/generate", json={
        "course_id": "ml-fundamentals",
        "lesson_id": "lesson-1-deep-learning",
        "current_time_seconds": 180.0,
        "num_questions": 2
    })
    assert quiz_res.status_code == 200
    quiz_data = quiz_res.json()
    assert len(quiz_data["questions"]) > 0

    # Quiz Submit
    q1 = quiz_data["questions"][0]
    submit_res = client.post("/api/quiz/submit", json={
        "course_id": "ml-fundamentals",
        "lesson_id": "lesson-1-deep-learning",
        "timestamp_context_seconds": 180.0,
        "questions_data": quiz_data["questions"],
        "user_answers": {q1["id"]: q1.get("correct_index", 0)}
    })
    assert submit_res.status_code == 200
    sub_data = submit_res.json()
    assert sub_data["percentage"] >= 0.0


def test_api_interview_flow(client):
    start_res = client.post("/api/interview/start", json={
        "role_target": "Full Stack AI Engineer",
        "interview_type": "mixed",
        "difficulty": "intermediate",
        "total_questions": 2
    })
    assert start_res.status_code == 200
    session_id = start_res.json()["session_id"]

    answer_res = client.post(f"/api/interview/{session_id}/answer", json={
        "answer": "I build modular FastAPI backends with strict typing and Next.js reactive frontends."
    })
    assert answer_res.status_code == 200


def test_api_invalid_request_handling(client):
    # Missing required question string
    res = client.post("/api/ask", json={
        "course_id": "ml-fundamentals",
        "question": "   "
    })
    assert res.status_code == 400

    # Non-existent course
    res = client.get("/api/courses/non-existent-12345")
    assert res.status_code == 404
