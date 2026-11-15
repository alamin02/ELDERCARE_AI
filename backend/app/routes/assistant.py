from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import User, Conversation
from backend.app.schemas import (
    ChatQueryRequest,
    ChatQueryResponse,
    ConversationHistoryItem
)
from backend.app.security.rbac import get_current_user, verify_and_resolve_elderly_id
from backend.app.ai.assistant_engine import process_eldercare_chat

router = APIRouter(prefix="/assistant", tags=["AI ElderCare Assistant"])


@router.post("/chat", response_model=ChatQueryResponse)
async def chat_with_assistant(
    payload: ChatQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Context-aware AI Healthcare Assistant endpoint.
    Retrieves authorized patient context, runs medical safety guardrails,
    and returns structured output in English or Bengali.
    """
    resolved_id = verify_and_resolve_elderly_id(payload.elderly_id, current_user, db)

    response = await process_eldercare_chat(
        elderly_id=resolved_id,
        user_id=current_user.id,
        message=payload.message,
        session_id=payload.session_id or "default-session",
        requested_lang=payload.language,
        db=db
    )
    return response


@router.get("/history", response_model=List[ConversationHistoryItem])
def get_chat_history(
    elderly_id: Optional[int] = Query(None),
    session_id: Optional[str] = Query("default-session"),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve chat history."""
    resolved_id = verify_and_resolve_elderly_id(elderly_id, current_user, db)

    query = db.query(Conversation).filter(
        Conversation.elderly_id == resolved_id
    )
    if session_id:
        query = query.filter(Conversation.session_id == session_id)

    records = query.order_by(Conversation.created_at.asc()).limit(limit).all()

    items = []
    for r in records:
        items.append(ConversationHistoryItem(
            id=r.id,
            role=r.role,
            message=r.message,
            structured_data=r.structured_data,
            created_at=r.created_at.isoformat()
        ))
    return items


@router.delete("/history")
def clear_chat_history(
    elderly_id: Optional[int] = Query(None),
    session_id: Optional[str] = Query("default-session"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clear conversation history for a given session."""
    resolved_id = verify_and_resolve_elderly_id(elderly_id, current_user, db)

    query = db.query(Conversation).filter(Conversation.elderly_id == resolved_id)
    if session_id:
        query = query.filter(Conversation.session_id == session_id)

    deleted_count = query.delete()
    db.commit()
    return {"message": "Chat history cleared", "deleted_turns": deleted_count}
