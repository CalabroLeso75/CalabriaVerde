"""
Modello Employee — Anagrafica completa dei dipendenti.
Chiave unica: codice_fiscale (collegato a User).
"""
from datetime import datetime, date, timezone
from sqlalchemy import (
    Column, Integer, String, DateTime, Date, Boolean, Enum, Text,
    Float, ForeignKey
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class Employee(Base):
    """Anagrafica completa del dipendente."""
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=True, index=True)
    codice_fiscale = Column(String(16), unique=True, nullable=False, index=True)

    # Anagrafica
    nome = Column(String(100), nullable=False)
    cognome = Column(String(100), nullable=False)
    data_nascita = Column(Date, nullable=True)
    luogo_nascita = Column(String(100), nullable=True)
    provincia_nascita = Column(String(2), nullable=True)
    sesso = Column(Enum("M", "F", name="gender"), nullable=True)

    # Residenza
    indirizzo_residenza = Column(String(300), nullable=True)
    citta_residenza = Column(String(100), nullable=True)
    provincia_residenza = Column(String(2), nullable=True)
    cap_residenza = Column(String(5), nullable=True)

    # Domicilio (se diverso da residenza)
    indirizzo_domicilio = Column(String(300), nullable=True)
    citta_domicilio = Column(String(100), nullable=True)
    provincia_domicilio = Column(String(2), nullable=True)
    cap_domicilio = Column(String(5), nullable=True)

    # Contatti
    telefono_personale = Column(String(20), nullable=True)
    telefono_lavoro = Column(String(20), nullable=True)
    email_personale = Column(String(255), nullable=True)
    email_istituzionale = Column(String(255), nullable=True, index=True)

    # Contratto
    tipo_contratto = Column(
        Enum("indeterminato", "determinato", "stagionale", "somministrazione",
             "collaborazione", "volontario", name="contract_type"),
        nullable=True,
    )
    data_assunzione = Column(Date, nullable=True)
    data_cessazione = Column(Date, nullable=True)
    livello_inquadramento = Column(String(10), nullable=True)
    area_contrattuale = Column(String(50), nullable=True)
    matricola = Column(String(20), unique=True, nullable=True, index=True)

    # Organizzazione
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True, index=True)
    settore = Column(String(100), nullable=True)
    ufficio = Column(String(100), nullable=True)
    mansione = Column(String(200), nullable=True)

    # Stato
    stato = Column(
        Enum("in_servizio", "aspettativa", "malattia", "infortunio",
             "maternita", "distaccato", "sospeso", "cessato", name="employee_status"),
        default="in_servizio",
        nullable=False,
        index=True,
    )

    # Patenti
    patente_tipo = Column(String(10), nullable=True)  # B, C, D, etc.
    patente_scadenza = Column(Date, nullable=True)

    # Foto
    foto_url = Column(String(500), nullable=True)

    # Timestamp
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Note
    note = Column(Text, nullable=True)

    # Relazioni
    user = relationship("User", backref="employee")
    organization = relationship("Organization", backref="employees")
    qualifications = relationship("EmployeeQualification", back_populates="employee", lazy="selectin")
    documents = relationship("EmployeeDocument", back_populates="employee", lazy="dynamic")

    def __repr__(self):
        return f"<Employee {self.cognome} {self.nome} ({self.codice_fiscale})>"


class EmployeeQualification(Base):
    """Qualifiche operative e abilitazioni del dipendente."""
    __tablename__ = "employee_qualifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)

    tipo = Column(
        Enum("qualifica_operativa", "abilitazione", "certificazione",
             "corso_formazione", "patentino", name="qual_type"),
        nullable=False,
    )
    nome = Column(String(200), nullable=False)
    ente_rilascio = Column(String(200), nullable=True)
    numero_documento = Column(String(100), nullable=True)
    data_conseguimento = Column(Date, nullable=True)
    data_scadenza = Column(Date, nullable=True)
    is_valid = Column(Boolean, default=True)
    note = Column(Text, nullable=True)

    # Timestamp
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relazioni
    employee = relationship("Employee", back_populates="qualifications")


class EmployeeDocument(Base):
    """Documenti allegati al fascicolo personale del dipendente."""
    __tablename__ = "employee_documents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)

    tipo = Column(String(100), nullable=False)  # contratto, certificato, altro
    titolo = Column(String(300), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=True)  # bytes
    mime_type = Column(String(100), nullable=True)

    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    note = Column(Text, nullable=True)

    # Relazioni
    employee = relationship("Employee", back_populates="documents")
