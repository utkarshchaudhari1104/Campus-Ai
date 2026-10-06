import os
import shutil
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user, require_admin, scope_to_university
from app.models.user import User
from app.models.document import Document
from app.services.pdf_service import extract_text_from_pdf, chunk_text, OCRUnavailableError
from app.services.vector_store import add_document_chunks, remove_document_chunks
from app.core.config import get_settings

router = APIRouter(prefix="/api/documents", tags=["documents"])
settings = get_settings()


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    category: str = Form(default="general"),
    description: str = Form(default=""),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    os.makedirs(settings.upload_dir, exist_ok=True)
    safe_name = file.filename.replace(" ", "_")
    filepath = os.path.join(settings.upload_dir, safe_name)
    if os.path.exists(filepath):
        name, extension = os.path.splitext(safe_name)
        safe_name = f"{name}_{uuid.uuid4().hex[:8]}{extension}"
        filepath = os.path.join(settings.upload_dir, safe_name)

    # Save file
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        pages = extract_text_from_pdf(filepath)
        chunks = chunk_text(pages)
    except OCRUnavailableError as e:
        os.remove(filepath)
        raise HTTPException(status_code=503, detail=str(e))
    except Exception:
        os.remove(filepath)
        raise HTTPException(
            status_code=422,
            detail="Could not read this PDF. Make sure it is valid and not password-protected.",
        )

    if not chunks:
        os.remove(filepath)
        raise HTTPException(
            status_code=422,
            detail="No readable text was found, even after automatic OCR. Check the scan quality and page orientation.",
        )

    # Create DB record
    doc = Document(
        filename=safe_name,
        original_name=file.filename,
        category=category,
        description=description,
        uploaded_by=admin.id,
        university_id=admin.university_id,
        is_processed=False
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Process PDF → chunks → embeddings → FAISS
    try:
        add_document_chunks(doc.id, file.filename, chunks, admin.university_id)
        doc.total_pages = len(pages)
        doc.total_chunks = len(chunks)
        doc.is_processed = True
        db.commit()
    except Exception as e:
        doc.is_processed = False
        db.commit()
        raise HTTPException(status_code=500, detail=f"PDF processing failed: {str(e)}")

    return {"message": "Document uploaded and processed", "document": _doc_dict(doc)}


@router.get("/")
def list_documents(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    docs = scope_to_university(
        db.query(Document),
        Document,
        current_user,
        include_global=False,
    ).order_by(Document.uploaded_at.desc()).all()
    return [_doc_dict(d) for d in docs]


@router.get("/{doc_id}/file")
def open_document(
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = scope_to_university(
        db.query(Document).filter(Document.id == doc_id),
        Document,
        current_user,
        include_global=False,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    filepath = os.path.join(settings.upload_dir, doc.filename)
    if not os.path.isfile(filepath):
        raise HTTPException(status_code=404, detail="Document file is unavailable")

    return FileResponse(
        filepath,
        media_type="application/pdf",
        filename=doc.original_name,
        content_disposition_type="inline",
    )


@router.delete("/{doc_id}")
def delete_document(doc_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    query = db.query(Document).filter(Document.id == doc_id)
    query = scope_to_university(query, Document, admin, include_global=False)
    doc = query.first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Remove from vector store
    remove_document_chunks(doc_id)

    # Remove file
    filepath = os.path.join(settings.upload_dir, doc.filename)
    if os.path.exists(filepath):
        os.remove(filepath)

    db.delete(doc)
    db.commit()
    return {"message": "Document deleted"}


def _doc_dict(doc: Document) -> dict:
    return {
        "id": doc.id,
        "filename": doc.filename,
        "original_name": doc.original_name,
        "category": doc.category,
        "description": doc.description,
        "total_pages": doc.total_pages,
        "total_chunks": doc.total_chunks,
        "is_processed": doc.is_processed,
        "uploaded_at": doc.uploaded_at.isoformat()
    }
