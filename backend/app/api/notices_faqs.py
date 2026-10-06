from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user, require_admin, scope_to_university
from app.models.user import User
from app.models.document import Notice, FAQ

router = APIRouter(tags=["notices-faqs"])


# ─── NOTICES ────────────────────────────────────────────────────────────────

notice_router = APIRouter(prefix="/api/notices")


class NoticeRequest(BaseModel):
    title: str
    content: str
    category: str = "general"


@notice_router.get("/")
def get_notices(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notices = scope_to_university(
        db.query(Notice).filter(Notice.is_active == True),
        Notice,
        current_user,
        include_global=False,
    ).order_by(Notice.created_at.desc()).all()
    return [_notice_dict(n) for n in notices]


@notice_router.post("/")
def create_notice(req: NoticeRequest, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    notice = Notice(
        title=req.title,
        content=req.content,
        category=req.category,
        created_by=admin.id,
        university_id=admin.university_id,
    )
    db.add(notice)
    db.commit()
    db.refresh(notice)
    return _notice_dict(notice)


@notice_router.delete("/{notice_id}")
def delete_notice(notice_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    notice = scope_to_university(
        db.query(Notice).filter(Notice.id == notice_id),
        Notice,
        admin,
        include_global=False,
    ).first()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    db.delete(notice)
    db.commit()
    return {"message": "Notice deleted"}


def _notice_dict(n: Notice) -> dict:
    return {"id": n.id, "title": n.title, "content": n.content, "category": n.category, "created_at": n.created_at.isoformat()}


# ─── FAQs ────────────────────────────────────────────────────────────────────

faq_router = APIRouter(prefix="/api/faqs")


class FAQRequest(BaseModel):
    question: str
    answer: str
    category: str = "general"


@faq_router.get("/")
def get_faqs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    faqs = scope_to_university(
        db.query(FAQ).filter(FAQ.is_active == True),
        FAQ,
        current_user,
        include_global=False,
    ).order_by(FAQ.view_count.desc()).all()
    return [_faq_dict(f) for f in faqs]


@faq_router.post("/")
def create_faq(req: FAQRequest, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    faq = FAQ(
        question=req.question,
        answer=req.answer,
        category=req.category,
        created_by=admin.id,
        university_id=admin.university_id,
    )
    db.add(faq)
    db.commit()
    db.refresh(faq)
    return _faq_dict(faq)


@faq_router.delete("/{faq_id}")
def delete_faq(faq_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    faq = scope_to_university(
        db.query(FAQ).filter(FAQ.id == faq_id),
        FAQ,
        admin,
        include_global=False,
    ).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    db.delete(faq)
    db.commit()
    return {"message": "FAQ deleted"}


def _faq_dict(f: FAQ) -> dict:
    return {"id": f.id, "question": f.question, "answer": f.answer, "category": f.category, "view_count": f.view_count, "created_at": f.created_at.isoformat()}
