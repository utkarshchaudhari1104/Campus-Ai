import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.document import ChatSession, ChatMessage
from app.services.vector_store import find_student_context, find_student_division, find_student_roll_number, search
from app.services.llm_service import get_llm_response

router = APIRouter(prefix="/api/chat", tags=["chat"])
MIN_RELEVANCE_SCORE = 0.3
NO_ANSWER = "No answer found in the university documents."


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[int] = None


@router.post("/")
def chat(req: ChatRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Get or create session
    if req.session_id:
        session = db.query(ChatSession).filter(
            ChatSession.id == req.session_id,
            ChatSession.user_id == current_user.id
        ).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
    else:
        title = req.message[:60] + ("..." if len(req.message) > 60 else "")
        session = ChatSession(user_id=current_user.id, title=title)
        db.add(session)
        db.commit()
        db.refresh(session)

    # Load conversation history
    history_msgs = db.query(ChatMessage).filter(
        ChatMessage.session_id == session.id
    ).order_by(ChatMessage.created_at).all()
    conversation_history = [{"role": m.role, "content": m.content} for m in history_msgs]

    # RAG: search relevant chunks from uploaded docs
    question_chunks = search(
        req.message,
        top_k=5,
        university_id=current_user.university_id,
        include_global=current_user.role == "admin",
    )
    roll_context = None
    division_context = None
    direct_answer = None
    question_lower = req.message.lower()
    personal_question = any(keyword in question_lower for keyword in (
        "my ", "my?", "what is my", "who am i", "roll", "division", "class",
    ))
    student_chunks = find_student_context(
        current_user.name,
        current_user.enrollment_no,
        current_user.university_id,
    ) if personal_question else []
    if ("roll" in question_lower and "number" in question_lower) or "roll no" in question_lower:
        roll_context = find_student_roll_number(
            current_user.name,
            current_user.enrollment_no,
            current_user.university_id,
        )
    if "division" in question_lower or "class" in question_lower:
        division_context = find_student_division(
            current_user.name,
            current_user.enrollment_no,
            current_user.university_id,
        )

    if roll_context:
        answer = f"Your roll number is {roll_context['roll_number']}."
        context_chunks = [roll_context]
        question_has_relevant_context = True
    elif division_context:
        answer = f"Your division is {division_context['division']}."
        context_chunks = [division_context]
        question_has_relevant_context = True
    else:
        context_chunks = []
        seen_chunks = set()
        for chunk in [*question_chunks, *student_chunks]:
            key = (chunk.get("doc_id"), chunk.get("page"), chunk.get("text"))
            if key not in seen_chunks:
                seen_chunks.add(key)
                context_chunks.append(chunk)

        question_has_relevant_context = any(
            chunk.get("score", 0) >= MIN_RELEVANCE_SCORE
            for chunk in question_chunks
        )
        if "what is my name" in question_lower and student_chunks:
            direct_answer = f"Your name is {current_user.name}."
            context_chunks = student_chunks[:1]
            question_has_relevant_context = True
    if roll_context or division_context:
        is_answered = True
    elif direct_answer:
        answer = direct_answer
        is_answered = True
    elif not question_has_relevant_context:
        answer = NO_ANSWER
        is_answered = False
        context_chunks = []
    else:
        answer = get_llm_response(req.message, context_chunks, conversation_history)
        is_answered = True

    # Build sources list (only chunks with decent relevance)
    sources = []
    seen = set()
    for chunk in context_chunks:
        if chunk.get("score", 0) < 0.25:
            continue
        key = f"{chunk['doc_name']}_{chunk['page']}"
        if key not in seen:
            seen.add(key)
            sources.append({
                "document": chunk["doc_name"],
                "page": chunk["page"],
                "score": round(chunk["score"], 3)
            })

    # Save messages
    db.add(ChatMessage(session_id=session.id, role="user", content=req.message, is_answered=True))
    assistant_msg = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=answer,
        sources=json.dumps(sources),
        is_answered=is_answered
    )
    db.add(assistant_msg)
    db.commit()

    return {"session_id": session.id, "answer": answer, "sources": sources, "message_id": assistant_msg.id}


@router.get("/sessions")
def get_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id
    ).order_by(ChatSession.updated_at.desc()).all()
    return [{"id": s.id, "title": s.title, "created_at": s.created_at.isoformat()} for s in sessions]


@router.get("/sessions/{session_id}")
def get_session_messages(session_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at).all()

    return {
        "session": {"id": session.id, "title": session.title},
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "sources": json.loads(m.sources) if m.sources else [],
                "created_at": m.created_at.isoformat()
            } for m in messages
        ]
    }


@router.delete("/sessions/{session_id}")
def delete_session(session_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
    return {"message": "Session deleted"}


@router.get("/suggested-questions")
def suggested_questions():
    return {
        "questions": [
            "What is the attendance requirement for exams?",
            "How does the PBL grading work?",
            "What are the library timings?",
            "What is the fee structure for this semester?",
            "How do I apply for hostel accommodation?",
            "What are the placement statistics?",
            "What are the rules for internal assessment?",
            "How do I apply for a scholarship?",
            "What is the exam schedule?",
            "How do I contact the examination department?"
        ]
    }
