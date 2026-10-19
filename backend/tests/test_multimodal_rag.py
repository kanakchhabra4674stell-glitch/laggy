import os
import pytest
from app.services.retrieval import TimestampGatedRetriever
from app.services.tutor_service import TutorService
from app.services.parser import parse_pdf, parse_pptx, parse_vtt_or_srt


def test_pdf_parsing_and_page_citation(db_session):
    tutor = TutorService(db_session)
    course_id = "ml-fundamentals"

    # Query targeting PDF content: "Linear activation z = W*x + b" from Module 1 / Page 1
    response = tutor.ask(
        course_id=course_id,
        question="What is the formula for linear activation and forward pass in the study guide?",
        current_time_seconds=600.0
    )

    assert response["abstained"] is False
    pdf_citations = [c for c in response["citations"] if c.get("page_number") is not None]
    assert len(pdf_citations) > 0
    assert pdf_citations[0]["page_number"] in [1, 2, 3]


def test_pptx_parsing_and_slide_citation(db_session):
    tutor = TutorService(db_session)
    course_id = "ml-fundamentals"

    # Query targeting Slide 3: "Sigmoid saturates at 0 and 1, causing severe vanishing gradient problems"
    response = tutor.ask(
        course_id=course_id,
        question="Which activation function causes vanishing gradient problems in the slides?",
        current_time_seconds=600.0
    )

    assert response["abstained"] is False
    ppt_citations = [c for c in response["citations"] if c.get("slide_number") is not None]
    assert len(ppt_citations) > 0
    assert ppt_citations[0]["slide_number"] in [1, 2, 3, 4]


def test_unsupported_question_explicit_abstention(db_session):
    tutor = TutorService(db_session)
    course_id = "ml-fundamentals"

    # Question completely unrelated to neural networks, ML, or uploaded resources
    response = tutor.ask(
        course_id=course_id,
        question="What is the average flight speed of an African Swallow carrying a coconut?",
        current_time_seconds=300.0
    )

    assert response["abstained"] is True
    assert "could not find information" in response["answer"].lower() or "not covered" in response["answer"].lower()
    assert len(response["citations"]) == 0


def test_parser_functions_directly():
    # Test VTT parser
    sample_vtt = """WEBVTT
00:00:01.000 --> 00:00:05.500
First segment test.

00:00:06.000 --> 00:00:10.000
Second segment test.
"""
    segments = parse_vtt_or_srt(sample_vtt)
    assert len(segments) == 2
    assert segments[0]["start_seconds"] == 1.0
    assert segments[0]["end_seconds"] == 5.5
    assert segments[0]["text"] == "First segment test."
