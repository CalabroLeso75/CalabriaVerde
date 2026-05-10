"""
Router API per autenticazione.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
)
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    UserResponse,
)

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """
    Registrazione nuovo utente.
    L'utente viene creato con stato 'pending' e deve essere approvato da un responsabile.
    """
    # Verifica email univoca
    existing_email = db.query(User).filter(User.email == request.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email già registrata",
        )

    # Verifica codice fiscale univoco
    existing_cf = db.query(User).filter(User.codice_fiscale == request.codice_fiscale.upper()).first()
    if existing_cf:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Codice fiscale già registrato",
        )

    # Crea utente con stato pending
    user = User(
        email=request.email.lower(),
        password_hash=get_password_hash(request.password),
        codice_fiscale=request.codice_fiscale.upper(),
        nome=request.nome.strip(),
        cognome=request.cognome.strip(),
        telefono=request.telefono,
        status="pending",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Login utente. Restituisce access_token e refresh_token.
    Solo utenti con stato 'attivo' possono effettuare il login.
    """
    user = db.query(User).filter(User.email == request.email.lower()).first()

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o password non corretti",
        )

    if user.status == "pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account in attesa di approvazione",
        )

    if user.status != "attivo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account {user.status}. Contattare l'amministratore.",
        )

    # Aggiorna ultimo accesso
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    # Genera token
    token_data = {"sub": str(user.id), "cf": user.codice_fiscale}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Rinnova access token usando il refresh token."""
    payload = decode_token(request.refresh_token)

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token non valido per il refresh",
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()

    if not user or user.status != "attivo":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utente non trovato o non attivo",
        )

    token_data = {"sub": str(user.id), "cf": user.codice_fiscale}
    new_access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Restituisce i dati dell'utente corrente autenticato."""
    return current_user
