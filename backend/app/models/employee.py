"""
Modello Employee — Gestionale Calabria Verde
Progettato a partire dall'analisi di:
  - internal_employees (dipendenti diretti Calabria Verde)
  - external_employees (collaboratori/stagionali tramite organizzazioni esterne)
  - employee_operational_qualifications
  - employee_operational_role_assignments

Schema unificato con tipo discriminator (interno/esterno)
"""

from datetime import date
from enum import Enum as PyEnum
from sqlalchemy import (
    Column, Integer, String, Boolean, Date, Text, Enum,
    ForeignKey, JSON, DateTime, UniqueConstraint, Index
)
from sqlalchemy.orm import backref, relationship
from sqlalchemy.sql import func

from app.core.database import Base
from app.models.organization import Organization  # noqa: F401
from app.models.user import User  # noqa: F401


# ============================================
# ENUM TYPES
# ============================================

class EmployeeType(str, PyEnum):
    """Tipo di rapporto con Calabria Verde."""
    interno = "interno"        # Dipendente diretto (ex internal_employees)
    esterno = "esterno"        # Collaboratore/stagionale tramite org esterna (ex external_employees)


class EmployeeStatus(str, PyEnum):
    """Stato operativo del dipendente."""
    in_servizio   = "in_servizio"
    malattia      = "malattia"
    infortunio    = "infortunio"
    aspettativa   = "aspettativa"
    maternita     = "maternita"
    distaccato    = "distaccato"
    sospeso       = "sospeso"
    cessato       = "cessato"
    pensionato    = "pensionato"


class ContractType(str, PyEnum):
    indeterminato  = "indeterminato"
    determinato    = "determinato"
    stagionale     = "stagionale"
    somministrazione = "somministrazione"
    collaborazione = "collaborazione"
    volontario     = "volontario"


class Gender(str, PyEnum):
    M = "M"
    F = "F"
    NB = "NB"


class RetirementStatus(str, PyEnum):
    non_verificata = "non_verificata"
    verificata     = "verificata"
    pensionato     = "pensionato"
    pensionata     = "pensionata"


# ============================================
# EMPLOYEE (tabella unificata interna/esterna)
# ============================================

class Employee(Base):
    """
    Anagrafica evoluta dipendenti Calabria Verde.
    
    Unifica internal_employees ed external_employees in un'unica tabella
    con discriminator 'tipo' per distinguere il tipo di rapporto.
    """
    __tablename__ = "employees"

    # --- Chiave primaria ---
    id = Column(Integer, primary_key=True, autoincrement=True)

    # --- Tipo rapporto ---
    tipo = Column(Enum(EmployeeType), nullable=False, default=EmployeeType.interno)

    # --- Chiave univoca ---
    codice_fiscale = Column(String(16), unique=True, nullable=False, index=True)

    # --- Dati anagrafici ---
    nome = Column(String(100), nullable=False)
    cognome = Column(String(100), nullable=False)
    genere = Column(Enum(Gender), nullable=True)
    data_nascita = Column(Date, nullable=True)
    luogo_nascita = Column(String(100), nullable=True)   # Città/comune di nascita (testo libero)
    provincia_nascita = Column(String(5), nullable=True)
    luogo_nascita_estero = Column(String(200), nullable=True)  # Per nati all'estero

    # --- Contatti istituzionali ---
    email_istituzionale = Column(String(150), unique=True, nullable=True, index=True)
    pec = Column(String(150), nullable=True)
    telefono_lavoro = Column(String(30), nullable=True)

    # --- Contatti personali ---
    email_personale = Column(String(150), nullable=True)
    telefono_personale = Column(String(30), nullable=True)
    telefono_secondario = Column(String(30), nullable=True)

    # --- Dati contrattuali ---
    tipo_contratto = Column(Enum(ContractType), nullable=True)
    data_assunzione = Column(Date, nullable=True)
    data_fine_contratto = Column(Date, nullable=True)
    numero_matricola = Column(String(20), unique=True, nullable=True)  # badge_number

    # --- Posizione e qualifica ---
    mansione = Column(String(200), nullable=True)        # position / job_title
    livello_inquadramento = Column(String(50), nullable=True)  # level
    ccnl_code = Column(String(50), nullable=True)
    ccnl_comparto = Column(String(100), nullable=True)
    macro_inquadramento = Column(String(50), nullable=True)
    profilo_professionale = Column(String(150), nullable=True)
    categoria_inquadramento = Column(String(50), nullable=True)
    posizione_economica = Column(String(20), nullable=True)
    orario_settimanale = Column(Integer, nullable=True)
    regime_orario = Column(String(50), nullable=True)
    scatti_anzianita = Column(Integer, nullable=True)
    data_prossimo_scatto = Column(Date, nullable=True)
    integrativo_regionale = Column(Boolean, default=False, nullable=False)
    integrativo_regionale_note = Column(Text, nullable=True)
    applicazione_parziale_contratto = Column(Boolean, default=False, nullable=False)
    applicazione_parziale_note = Column(Text, nullable=True)
    provenienza_assorbimento = Column(String(50), nullable=True)
    ente_provenienza = Column(String(150), nullable=True)
    tipo_collaborazione = Column(String(100), nullable=True)

    # --- Stato operativo ---
    stato = Column(Enum(EmployeeStatus), nullable=False, default=EmployeeStatus.in_servizio)
    stato_quiescenza = Column(Enum(RetirementStatus), nullable=True, default=RetirementStatus.non_verificata)

    # --- Organizzazione di appartenenza ---
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True)

    # --- Flag operativi AIB (da operational_flags migration) ---
    is_aib_qualificato     = Column(Boolean, default=False, nullable=False)
    is_dos                 = Column(Boolean, default=False, nullable=False)  # Direttore Operazioni Spegnimento
    is_emergency_available = Column(Boolean, default=False, nullable=False)
    is_emergency_coordinator = Column(Boolean, default=False, nullable=False)
    is_operations_room_manager  = Column(Boolean, default=False, nullable=False)
    is_operations_room_operator = Column(Boolean, default=False, nullable=False)
    is_mechanical_operator = Column(Boolean, default=False, nullable=False)
    is_aib_pc_operator     = Column(Boolean, default=False, nullable=False)  # Operatore PC2
    is_pc_operator         = Column(Boolean, default=False, nullable=False)
    is_driver              = Column(Boolean, default=False, nullable=False)

    # --- Documenti e patenti ---
    patenti = Column(JSON, nullable=True)              # es. ["B", "C", "D", "E", "patente_nautica"]
    abilitazioni = Column(JSON, nullable=True)         # es. ["motosega", "decespugliatore"]
    documenti_scadenza = Column(JSON, nullable=True)   # {tipo: data_scadenza}

    # --- Note ---
    note = Column(Text, nullable=True)

    # --- Audit ---
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # --- Collegamento utente di sistema ---
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, unique=True)

    # ============================================
    # RELAZIONI
    # ============================================
    organization = relationship("Organization", backref="employees")
    user = relationship("User", backref=backref("employee", uselist=False), foreign_keys=[user_id])
    qualifiche = relationship(
        "EmployeeQualification",
        back_populates="employee",
        cascade="all, delete-orphan",
        order_by="EmployeeQualification.created_at.desc()"
    )
    documenti = relationship(
        "EmployeeDocument",
        back_populates="employee",
        cascade="all, delete-orphan",
        order_by="EmployeeDocument.created_at.desc()"
    )
    ruoli_operativi = relationship(
        "EmployeeOperationalRole",
        back_populates="employee",
        cascade="all, delete-orphan",
    )

    # ============================================
    # INDICI E CONSTRAINTS
    # ============================================
    __table_args__ = (
        Index("idx_employee_cognome_nome", "cognome", "nome"),
        Index("idx_employee_tipo_stato", "tipo", "stato"),
        Index("idx_employee_org", "organization_id"),
        {
            "comment": "Anagrafica evoluta dipendenti e collaboratori Calabria Verde"
        },
    )

    def __repr__(self):
        return f"<Employee {self.cognome} {self.nome} ({self.codice_fiscale})>"


# ============================================
# QUALIFICHE OPERATIVE
# ============================================

class EmployeeQualification(Base):
    """
    Qualifiche operative del dipendente.
    Es: DOS, Capo Squadra AIB, Autista, ecc.
    Corrisponde a: employee_operational_qualifications
    """
    __tablename__ = "employee_qualifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)

    tipo_qualifica = Column(String(100), nullable=False)
    # Es: "dos", "capo_squadra_aib", "autista_c", "operatore_motosega", "elicotterista_pilota"

    is_attiva = Column(Boolean, default=True, nullable=False)
    data_conseguimento = Column(Date, nullable=True)
    data_scadenza = Column(Date, nullable=True)
    ente_rilascio = Column(String(200), nullable=True)
    numero_documento = Column(String(100), nullable=True)
    note = Column(Text, nullable=True)
    payload = Column(JSON, nullable=True)   # Dati extra specifici per tipo qualifica

    # Abilitato in seguito a evento PC2
    pc_emergency_event_id = Column(Integer, nullable=True)
    enabled_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    employee = relationship("Employee", back_populates="qualifiche")

    __table_args__ = (
        Index("idx_qual_employee_tipo", "employee_id", "tipo_qualifica"),
        Index("idx_qual_attiva", "employee_id", "is_attiva"),
    )

    def __repr__(self):
        return f"<Qualification {self.tipo_qualifica} emp={self.employee_id}>"


# ============================================
# DOCUMENTI ALLEGATI
# ============================================

class EmployeeDocument(Base):
    """
    Documenti allegati al fascicolo del dipendente.
    Es: contratto, patenti, certificati, CUD, ecc.
    """
    __tablename__ = "employee_documents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)

    tipo = Column(String(100), nullable=False)
    # Es: "contratto", "patente_b", "certificato_motosega", "ci", "passaporto", "cud"

    nome_file = Column(String(255), nullable=False)
    percorso_file = Column(String(500), nullable=False)  # Percorso storage relativo
    dimensione_bytes = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)

    data_scadenza = Column(Date, nullable=True)
    note = Column(Text, nullable=True)

    uploaded_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    employee = relationship("Employee", back_populates="documenti")

    def __repr__(self):
        return f"<Document {self.tipo} emp={self.employee_id}>"


# ============================================
# RUOLI OPERATIVI ASSEGNATI
# ============================================

class EmployeeOperationalRole(Base):
    """
    Assegnazione di ruoli operativi specifici.
    Corrisponde a: employee_operational_role_assignments
    Es: Squadra AIB, Cantiere X, Distaccamento Y
    """
    __tablename__ = "employee_operational_roles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)

    nome_ruolo = Column(String(200), nullable=False)
    # Es: "Capo Squadra AIB — Distaccamento Cosenza", "DOS Zona Nord", "Custode Bosco Demaniale X"

    tipo_ruolo = Column(String(100), nullable=True)
    # Es: "aib", "cantiere", "magazzino", "sala_operativa", "distaccamento"

    data_inizio = Column(Date, nullable=True)
    data_fine = Column(Date, nullable=True)
    is_attivo = Column(Boolean, default=True, nullable=False)

    assigned_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    note = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    employee = relationship("Employee", back_populates="ruoli_operativi")

    __table_args__ = (
        Index("idx_role_employee_attivo", "employee_id", "is_attivo"),
        Index("idx_role_tipo", "tipo_ruolo"),
    )

    def __repr__(self):
        return f"<OperationalRole {self.nome_ruolo} emp={self.employee_id}>"
