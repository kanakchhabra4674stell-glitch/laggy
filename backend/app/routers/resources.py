import os
import uuid
import shutil
from typing import Optional, List
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Resource, DocumentChunk, TranscriptSegment, Course
from app.config import settings
from app.services.parser import (
    parse_pdf,
    parse_pptx,
    parse_docx,
    parse_vtt_or_srt,
    parse_text_file,
    chunk_text
)
from app.services.embeddings import compute_embeddings

router = APIRouter(prefix="/api", tags=["Resources & Ingestion"])

ALLOWED_EXTENSIONS = {".pdf", ".pptx", ".ppt", ".docx", ".txt", ".md", ".vtt", ".srt"}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB


@router.get("/resources")
def list_resources(course_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Resource)
    if course_id:
        query = query.filter(Resource.course_id == course_id)
    resources = query.order_by(Resource.created_at.desc()).all()

    return [
        {
            "id": r.id,
            "course_id": r.course_id,
            "lesson_id": r.lesson_id,
            "title": r.title,
            "file_type": r.file_type,
            "file_size": r.file_size,
            "status": r.status,
            "error_message": r.error_message,
            "unlock_timestamp_seconds": r.unlock_timestamp_seconds,
            "chunk_count": len(r.chunks),
            "created_at": r.created_at.isoformat()
        }
        for r in resources
    ]


@router.get("/resources/{resource_id}")
def get_resource(resource_id: str, db: Session = Depends(get_db)):
    r = db.query(Resource).filter(Resource.id == resource_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Resource not found")

    return {
        "id": r.id,
        "course_id": r.course_id,
        "lesson_id": r.lesson_id,
        "title": r.title,
        "file_type": r.file_type,
        "file_size": r.file_size,
        "status": r.status,
        "error_message": r.error_message,
        "unlock_timestamp_seconds": r.unlock_timestamp_seconds,
        "chunk_count": len(r.chunks),
        "created_at": r.created_at.isoformat()
    }


@router.post("/resources/upload")
async def upload_resource(
    course_id: str = Form(...),
    lesson_id: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    unlock_timestamp_seconds: Optional[float] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    resource_id = f"res_{uuid.uuid4().hex[:10]}"
    safe_filename = f"{resource_id}_{file.filename.replace(' ', '_')}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    # Save to disk
    with open(file_path, "wb") as buffer:
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File size exceeds maximum permitted limit (25MB)")
        buffer.write(content)

    file_type = ext.replace(".", "")
    res_title = title or file.filename

    resource = Resource(
        id=resource_id,
        course_id=course_id,
        lesson_id=lesson_id,
        title=res_title,
        file_type=file_type,
        file_path=file_path,
        file_size=len(content),
        status="processing",
        unlock_timestamp_seconds=unlock_timestamp_seconds
    )
    db.add(resource)
    db.commit()

    # Process and index
    try:
        chunks_to_create = []

        if file_type == "pdf":
            pages = parse_pdf(file_path)
            page_texts = [p["text"] for p in pages]
            page_vectors = compute_embeddings(page_texts)
            for idx, p in enumerate(pages):
                chunks_to_create.append(DocumentChunk(
                    id=str(uuid.uuid4()),
                    course_id=course_id,
                    lesson_id=lesson_id,
                    resource_id=resource.id,
                    resource_type="pdf",
                    chunk_index=idx,
                    text=p["text"],
                    page_number=p["page_number"],
                    unlock_timestamp_seconds=unlock_timestamp_seconds,
                    embedding_vector=page_vectors[idx] if idx < len(page_vectors) else None
                ))

        elif file_type in ["pptx", "ppt"]:
            slides = parse_pptx(file_path)
            slide_texts = [s["text"] for s in slides]
            slide_vectors = compute_embeddings(slide_texts)
            for idx, s in enumerate(slides):
                chunks_to_create.append(DocumentChunk(
                    id=str(uuid.uuid4()),
                    course_id=course_id,
                    lesson_id=lesson_id,
                    resource_id=resource.id,
                    resource_type="pptx",
                    chunk_index=idx,
                    text=s["text"],
                    slide_number=s["slide_number"],
                    unlock_timestamp_seconds=unlock_timestamp_seconds,
                    embedding_vector=slide_vectors[idx] if idx < len(slide_vectors) else None
                ))

        elif file_type in ["vtt", "srt"]:
            vtt_content = parse_text_file(file_path)
            segments = parse_vtt_or_srt(vtt_content)
            seg_texts = [s["text"] for s in segments]
            seg_vectors = compute_embeddings(seg_texts)

            for idx, seg in enumerate(segments):
                if lesson_id:
                    db.add(TranscriptSegment(
                        id=str(uuid.uuid4()),
                        lesson_id=lesson_id,
                        start_seconds=seg["start_seconds"],
                        end_seconds=seg["end_seconds"],
                        text=seg["text"],
                        source_id=resource.id
                    ))
                chunks_to_create.append(DocumentChunk(
                    id=str(uuid.uuid4()),
                    course_id=course_id,
                    lesson_id=lesson_id,
                    resource_id=resource.id,
                    resource_type="video_transcript",
                    chunk_index=idx,
                    text=seg["text"],
                    start_seconds=seg["start_seconds"],
                    end_seconds=seg["end_seconds"],
                    unlock_timestamp_seconds=None,
                    embedding_vector=seg_vectors[idx] if idx < len(seg_vectors) else None
                ))

        elif file_type == "docx":
            full_text = parse_docx(file_path)
            text_chunks = chunk_text(full_text)
            chunk_vectors = compute_embeddings(text_chunks)
            for idx, ch in enumerate(text_chunks):
                chunks_to_create.append(DocumentChunk(
                    id=str(uuid.uuid4()),
                    course_id=course_id,
                    lesson_id=lesson_id,
                    resource_id=resource.id,
                    resource_type="document",
                    chunk_index=idx,
                    text=ch,
                    unlock_timestamp_seconds=unlock_timestamp_seconds,
                    embedding_vector=chunk_vectors[idx] if idx < len(chunk_vectors) else None
                ))

        else:  # txt, md
            full_text = parse_text_file(file_path)
            text_chunks = chunk_text(full_text)
            chunk_vectors = compute_embeddings(text_chunks)
            for idx, ch in enumerate(text_chunks):
                chunks_to_create.append(DocumentChunk(
                    id=str(uuid.uuid4()),
                    course_id=course_id,
                    lesson_id=lesson_id,
                    resource_id=resource.id,
                    resource_type="text",
                    chunk_index=idx,
                    text=ch,
                    unlock_timestamp_seconds=unlock_timestamp_seconds,
                    embedding_vector=chunk_vectors[idx] if idx < len(chunk_vectors) else None
                ))

        for c in chunks_to_create:
            db.add(c)

        resource.status = "completed"
        db.commit()

        return {
            "resource_id": resource.id,
            "title": resource.title,
            "status": "completed",
            "chunks_created": len(chunks_to_create),
            "message": f"Successfully ingested and indexed {len(chunks_to_create)} knowledge chunks."
        }

    except Exception as e:
        db.rollback()
        resource.status = "failed"
        resource.error_message = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")
