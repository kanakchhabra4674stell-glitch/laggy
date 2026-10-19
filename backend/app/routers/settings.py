import os
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import settings
from app.services.llm_adapter import LLMAdapter

router = APIRouter(prefix="/api/settings", tags=["Configuration & Settings"])


class SettingsUpdate(BaseModel):
    gemini_api_key: Optional[str] = None
    gemini_model: Optional[str] = None


@router.get("")
def get_settings():
    llm = LLMAdapter()
    masked_key = ""
    if settings.GEMINI_API_KEY:
        masked_key = settings.GEMINI_API_KEY[:4] + "..." + settings.GEMINI_API_KEY[-4:]

    return {
        "app_env": settings.APP_ENV,
        "database_url": settings.DATABASE_URL.split("///")[-1],  # Show clean filename/host
        "gemini_api_key_configured": bool(settings.GEMINI_API_KEY),
        "masked_gemini_api_key": masked_key,
        "gemini_model": settings.GEMINI_MODEL,
        "embedding_model": settings.EMBEDDING_MODEL,
        "device": settings.DEVICE,
        "gemini_active": llm.is_gemini_active,
        "active_mode": f"Gemini API ({settings.GEMINI_MODEL})" if llm.is_gemini_active else "Extractive Local Fallback Engine"
    }


@router.post("")
def update_settings(payload: SettingsUpdate):
    if payload.gemini_api_key is not None:
        settings.GEMINI_API_KEY = payload.gemini_api_key.strip()
        os.environ["GEMINI_API_KEY"] = payload.gemini_api_key.strip()

    if payload.gemini_model is not None:
        settings.GEMINI_MODEL = payload.gemini_model.strip()

    llm = LLMAdapter()
    return {
        "message": "Settings updated successfully",
        "gemini_api_key_configured": bool(settings.GEMINI_API_KEY),
        "gemini_active": llm.is_gemini_active,
        "active_mode": f"Gemini API ({settings.GEMINI_MODEL})" if llm.is_gemini_active else "Extractive Local Fallback Engine"
    }
