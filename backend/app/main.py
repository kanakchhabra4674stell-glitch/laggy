import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.db.database import engine, Base, SessionLocal
from app.db import models
from app.services.seed_data import seed_database

# Routers
from app.routers import health, courses, resources, ask, study, interview, settings as settings_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("PauseAI")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing PauseAI database and seed assets...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield
    logger.info("Shutting down PauseAI API...")


app = FastAPI(
    title="PauseAI API — Timestamp-Aware Interactive Learning Platform",
    description="Grounded video-based learning with strict server-enforced timestamp gating, multimodal RAG, and AI mock interviews.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please verify your request parameters."}
    )

# Include Routers
app.include_router(health.router)
app.include_router(courses.router)
app.include_router(resources.router)
app.include_router(ask.router)
app.include_router(study.router)
app.include_router(interview.router)
app.include_router(settings_router.router)

# Mount local media directory for video playback if available
if os.path.exists(settings.DATA_DIR):
    app.mount("/media", StaticFiles(directory=settings.DATA_DIR), name="media")


@app.get("/")
def root():
    return {
        "message": "Welcome to PauseAI API — AHGV BuildVerse 2026",
        "docs_url": "/docs",
        "health_check": "/api/health"
    }
