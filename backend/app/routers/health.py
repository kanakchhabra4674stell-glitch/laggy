from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.database import get_db
from app.config import settings
from app.services.llm_adapter import LLMAdapter

router = APIRouter(prefix="/api", tags=["Health"])


@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    llm = LLMAdapter()

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "service": "PauseAI Backend API",
        "version": "1.0.0",
        "database": db_status,
        "ai_provider": {
            "gemini_active": llm.is_gemini_active,
            "provider_name": f"Google Gemini ({settings.GEMINI_MODEL})" if llm.is_gemini_active else "Extractive Evidence RAG (Local)",
            "embedding_model": settings.EMBEDDING_MODEL,
            "device": settings.DEVICE
        },
        "storage": {
            "data_dir": settings.DATA_DIR,
            "upload_dir": settings.UPLOAD_DIR
        }
    }
