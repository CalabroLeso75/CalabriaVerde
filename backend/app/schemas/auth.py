"""
Schemi Pydantic per autenticazione e utenti.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# --- Auth ---

class RegisterRequest(BaseModel):
    """Richiesta di registrazione nuovo utente."""
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    codice_fiscale: str = Field(min_length=16, max_length=16, pattern=r"^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$")
    nome: str = Field(min_length=1, max_length=100)
    cognome: str = Field(min_length=1, max_length=100)
    telefono: Optional[str] = None


class LoginRequest(BaseModel):
    """Richiesta di login."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Risposta con i token JWT."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class RefreshTokenRequest(BaseModel):
    """Richiesta di rinnovo token."""
    refresh_token: str


# --- User ---

class UserResponse(BaseModel):
    """Risposta con dati utente (no password)."""
    id: int
    email: str
    codice_fiscale: str
    nome: str
    cognome: str
    telefono: Optional[str] = None
    status: str
    is_superadmin: bool = False
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    roles: List["UserRoleResponse"] = []

    class Config:
        from_attributes = True


class UserRoleResponse(BaseModel):
    """Ruolo assegnato a un utente."""
    id: int
    role_code: Optional[str] = None
    role_name: Optional[str] = None
    organization_name: Optional[str] = None
    module_scope: Optional[str] = None
    is_active: bool = True

    class Config:
        from_attributes = True


class ApproveUserRequest(BaseModel):
    """Richiesta di approvazione utente."""
    role_id: int
    organization_id: Optional[int] = None
    module_scope: Optional[str] = None


class RejectUserRequest(BaseModel):
    """Richiesta di rifiuto registrazione."""
    reason: str = Field(min_length=10)


# Risolvi riferimenti forward
TokenResponse.model_rebuild()
UserResponse.model_rebuild()
