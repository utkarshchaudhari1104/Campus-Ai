from fastapi import APIRouter, Depends
from fastapi import HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import require_admin, scope_to_university
from app.models.user import User
from app.models.document import Document, ChatSession, ChatMessage, Notice, FAQ
from app.services.vector_store import get_total_chunks

router = APIRouter(prefix="/api/admin", tags=["admin"])


class StudentStatusUpdate(BaseModel):
    is_active: bool


@router.get("/dashboard")
def get_dashboard(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    students = scope_to_university(
        db.query(User).filter(User.role == "student"),
        User,
        admin,
        include_global=admin.role != "university_admin",
    )
    documents = scope_to_university(
        db.query(Document),
        Document,
        admin,
        include_global=admin.role != "university_admin",
    )
    notices = scope_to_university(
        db.query(Notice).filter(Notice.is_active == True),
        Notice,
        admin,
        include_global=admin.role != "university_admin",
    )
    faqs = scope_to_university(
        db.query(FAQ).filter(FAQ.is_active == True),
        FAQ,
        admin,
        include_global=admin.role != "university_admin",
    )
    messages = db.query(ChatMessage).join(ChatSession).join(User)
    if admin.role != "admin":
        messages = messages.filter(User.university_id == admin.university_id)

    total_students = students.count()
    total_docs = documents.count()
    total_chats = messages.filter(ChatMessage.role == "user").count()
    unanswered = messages.filter(ChatMessage.is_answered == False).count()
    total_notices = notices.count()
    total_faqs = faqs.count()
    total_chunks = get_total_chunks(
        admin.university_id if admin.role != "admin" else None
    )

    # Recent questions (last 10 unanswered)
    unanswered_msgs = messages.filter(
        ChatMessage.role == "user", ChatMessage.is_answered == False
    ).order_by(ChatMessage.created_at.desc()).limit(10).all()

    return {
        "stats": {
            "total_students": total_students,
            "total_documents": total_docs,
            "total_questions": total_chats,
            "unanswered_questions": unanswered,
            "total_notices": total_notices,
            "total_faqs": total_faqs,
            "total_chunks_indexed": total_chunks
        },
        "unanswered_questions": [
            {"id": m.id, "content": m.content, "created_at": m.created_at.isoformat()}
            for m in unanswered_msgs
        ]
    }


@router.get("/users")
def get_all_users(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    users = scope_to_university(
        db.query(User).filter(User.role == "student"),
        User,
        admin,
        include_global=admin.role != "university_admin",
    ).order_by(User.created_at.desc()).all()
    return [
        _student_dict(u)
        for u in users
    ]


@router.get("/accounts")
def get_all_accounts(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    accounts = scope_to_university(
        db.query(User),
        User,
        admin,
        include_global=admin.role != "university_admin",
    ).order_by(User.created_at.desc()).all()
    return [_account_dict(account) for account in accounts]


@router.delete("/accounts/{user_id}")
def delete_account(user_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    account = scope_to_university(
        db.query(User).filter(User.id == user_id),
        User,
        admin,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    if account.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    if account.role in {"admin", "university_admin"} and admin.role != "admin":
        raise HTTPException(status_code=403, detail="Only a global admin can delete administrator accounts")
    if account.role == "admin" and account.is_active:
        active_admins = db.query(User).filter(
            User.role == "admin",
            User.is_active == True,
        ).count()
        if active_admins <= 1:
            raise HTTPException(status_code=400, detail="The last active global admin cannot be deleted")

    db.query(Document).filter(Document.uploaded_by == account.id).update(
        {Document.uploaded_by: None}, synchronize_session=False
    )
    db.query(Notice).filter(Notice.created_by == account.id).update(
        {Notice.created_by: None}, synchronize_session=False
    )
    db.query(FAQ).filter(FAQ.created_by == account.id).update(
        {FAQ.created_by: None}, synchronize_session=False
    )
    db.delete(account)
    db.commit()
    return {"message": "Account deleted"}


@router.get("/users/{user_id}")
def get_student(user_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    student = scope_to_university(
        db.query(User).filter(User.id == user_id, User.role == "student"),
        User,
        admin,
        include_global=admin.role != "university_admin",
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return _student_dict(student)


@router.patch("/users/{user_id}/status")
def update_student_status(
    user_id: int,
    req: StudentStatusUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    student = scope_to_university(
        db.query(User).filter(User.id == user_id, User.role == "student"),
        User,
        admin,
        include_global=admin.role != "university_admin",
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    student.is_active = req.is_active
    db.commit()
    db.refresh(student)
    return _student_dict(student)


def _student_dict(student: User) -> dict:
    return {
        "id": student.id,
        "name": student.name,
        "email": student.email,
        "university_id": student.university_id,
        "university_name": student.university.name if student.university else None,
        "age": student.age,
        "academic_year": student.academic_year,
        "department": student.department,
        "semester": student.semester,
        "enrollment_no": student.enrollment_no,
        "is_active": student.is_active,
        "created_at": student.created_at.isoformat(),
    }


def _account_dict(account: User) -> dict:
    return {
        "id": account.id,
        "name": account.name,
        "email": account.email,
        "role": account.role,
        "university_name": account.university.name if account.university else None,
        "is_active": account.is_active,
        "created_at": account.created_at.isoformat(),
    }
