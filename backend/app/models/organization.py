"""
Modello Organization — Struttura organizzativa di Calabria Verde.

Gerarchia: Sede Centrale → Distretto → Distaccamento → Postazione/Cantiere
"""
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean, Enum, Text,
    Float, ForeignKey
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class Organization(Base):
    """Unità organizzativa (sede, distretto, distaccamento, cantiere)."""
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    type = Column(
        Enum("sede_centrale", "distretto", "distaccamento", "postazione", "cantiere",
             name="org_type"),
        nullable=False,
        index=True,
    )

    # Gerarchia
    parent_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)

    # Geolocalizzazione
    address = Column(String(300), nullable=True)
    city = Column(String(100), nullable=True)
    province = Column(String(2), nullable=True)
    cap = Column(String(5), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # Contatti
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    pec = Column(String(255), nullable=True)

    # Stato
    is_active = Column(Boolean, default=True)
    is_temporary = Column(Boolean, default=False)  # Cantieri temporanei

    # Timestamp
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Note
    notes = Column(Text, nullable=True)

    # Relazioni
    parent = relationship("Organization", remote_side=[id], backref="children")

    def __repr__(self):
        return f"<Organization {self.code}: {self.name} ({self.type})>"
