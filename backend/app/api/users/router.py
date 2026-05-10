"""
Router API per gestione utenti (approvazione, ruoli, lista).
"""
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, UserRole, Role
from app.schemas.auth import UserResponse, ApproveUserRequest, RejectUserRequest

router = APIRouter()


@router.get("/pending", response_model=list[UserResponse])
async def get_pending_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lista utenti in attesa di approvazione."""
    # Solo admin/responsabili possono vedere i pending
    users = db.query(User).filter(User.status == "pending").order_by(User.created_at.desc()).all()
    return users


@router.post("/{user_id}/approve", response_model=UserResponse)
async def approve_user(
    user_id: int,
    request: ApproveUserRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Approva un utente in pending e gli assegna un ruolo.
    Solo admin e responsabili possono approvare.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    if user.status != "pending":
        raise HTTPException(status_code=400, detail=f"Utente non in stato pending (stato attuale: {user.status})")

    # Verifica che il ruolo esista
    role = db.query(Role).filter(Role.id == request.role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Ruolo non trovato")

    # Approva utente
    user.status = "attivo"
    user.approved_by = current_user.id
    user.approved_at = datetime.now(timezone.utc)

    # Assegna ruolo
    user_role = UserRole(
        user_id=user.id,
        role_id=request.role_id,
        organization_id=request.organization_id,
        module_scope=request.module_scope,
        assigned_by=current_user.id,
    )
    db.add(user_role)
    db.commit()
    db.refresh(user)

    return user


@router.post("/{user_id}/reject", response_model=UserResponse)
async def reject_user(
    user_id: int,
    request: RejectUserRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Rifiuta la registrazione di un utente."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utente non trovato")

    user.status = "disattivato"
    user.rejection_reason = request.reason
    user.approved_by = current_user.id
    user.approved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)

    return user


@router.get("/", response_model=list[UserResponse])
async def list_users(
    status: Optional[str] = Query(None, description="Filtra per stato"),
    search: Optional[str] = Query(None, description="Cerca per nome, cognome o CF"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lista utenti con filtri e paginazione."""
    query = db.query(User)

    if status:
        query = query.filter(User.status == status)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.nome.ilike(search_term)) |
            (User.cognome.ilike(search_term)) |
            (User.codice_fiscale.ilike(search_term)) |
            (User.email.ilike(search_term))
        )

    query = query.order_by(User.cognome, User.nome)
    offset = (page - 1) * page_size
    users = query.offset(offset).limit(page_size).all()

    return users
