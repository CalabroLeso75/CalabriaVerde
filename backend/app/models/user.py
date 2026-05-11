"""
Modello User — Account di accesso al gestionale.

Flusso: Registrazione → stato 'pending' → Approvazione da responsabile → stato 'attivo'
"""
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean, Enum, Text, ForeignKey
)
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.organization import Organization  # noqa: F401


class User(Base):
    """Account utente del gestionale."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    codice_fiscale = Column(String(16), unique=True, nullable=False, index=True)

    # Stato dell'account
    status = Column(
        Enum("pending", "attivo", "sospeso", "disattivato", name="user_status"),
        default="pending",
        nullable=False,
        index=True,
    )

    # Dati personali base (per il login/profilo)
    nome = Column(String(100), nullable=False)
    cognome = Column(String(100), nullable=False)
    telefono = Column(String(20), nullable=True)

    # Approvazione
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # Timestamp
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Flag speciali
    is_superadmin = Column(Boolean, default=False)

    # Relazioni
    roles = relationship(
        "UserRole",
        back_populates="user",
        primaryjoin="User.id == foreign(UserRole.user_id)",
        lazy="selectin",
    )
    approver = relationship("User", remote_side=[id], foreign_keys=[approved_by])

    def __repr__(self):
        return f"<User {self.cognome} {self.nome} ({self.codice_fiscale})>"


class Role(Base):
    """Ruoli di sistema del gestionale."""
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    level = Column(Integer, nullable=False, default=0)  # 0=base, 100=admin

    # Relazioni
    user_roles = relationship("UserRole", back_populates="role")


class UserRole(Base):
    """
    Assegnazione ruolo a utente con scope territoriale.
    Un utente può avere ruoli diversi in distretti diversi.
    """
    __tablename__ = "user_roles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)

    # Scope: settore (modulo) a cui si applica il ruolo
    module_scope = Column(String(50), nullable=True)  # None = tutti i moduli

    # Validità temporale
    valid_from = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    valid_to = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)

    # Timestamp
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    assigned_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relazioni
    user = relationship("User", back_populates="roles", foreign_keys=[user_id])
    role = relationship("Role", back_populates="user_roles")
    organization = relationship("Organization")
