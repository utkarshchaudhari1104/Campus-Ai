import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.database import engine, Base, migrate_schema
import app.models  # register all models

# Import routers
from app.api.auth import router as auth_router
from app.api.chat import router as chat_router
from app.api.documents import router as docs_router
from app.api.notices_faqs import notice_router, faq_router
from app.api.admin import router as admin_router

settings = get_settings()

# Create tables
Base.metadata.create_all(bind=engine)
migrate_schema()

# Ensure data directories exist
os.makedirs(settings.upload_dir, exist_ok=True)
os.makedirs(settings.vector_store_dir, exist_ok=True)

app = FastAPI(
    title="CampusAI API",
    description="AI University Assistant Backend",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(docs_router)
app.include_router(notice_router)
app.include_router(faq_router)
app.include_router(admin_router)


@app.get("/")
def root():
    return {"message": "CampusAI API is running", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
