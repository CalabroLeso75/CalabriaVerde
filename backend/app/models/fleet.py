"""
Modelli Parco Macchine.

Il modulo nasce tenendo conto delle tabelle legacy presenti nel vecchio
gestionale:
  - vehicles
  - vehicle_types
  - vehicle_revisions
  - vehicle_logs
  - aib_team_vehicles

Estende la base storica con sinistri e documenti dedicati al mezzo.
"""

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class VehicleType(Base):
    __tablename__ = "vehicle_types"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False, unique=True)
    documentazione = Column(Text, nullable=True)
    certificazioni = Column(Text, nullable=True)
    patente = Column(String(255), nullable=True)
    revisione = Column(String(255), nullable=True)
    assicurazione = Column(String(255), nullable=True)
    tipo_abilitazione = Column(String(255), nullable=True)
    ente_controllo = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)

    vehicles = relationship("Vehicle", back_populates="vehicle_type")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_type_id = Column(Integer, ForeignKey("vehicle_types.id", ondelete="SET NULL"), nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)

    targa = Column(String(255), nullable=False, unique=True)
    marca = Column(String(255), nullable=False)
    modello = Column(String(255), nullable=False)
    tipo = Column(String(255), nullable=False)

    immatricolazione_date = Column(Date, nullable=True)
    immatricolazione_mese = Column(Integer, nullable=True)
    immatricolazione_anno = Column(Integer, nullable=True)

    numero_telaio = Column(String(100), nullable=True)
    alimentazione = Column(String(50), nullable=True)
    euro_classe = Column(String(20), nullable=True)
    colore = Column(String(50), nullable=True)
    proprieta_tipo = Column(String(50), nullable=True)
    localizzazione_corrente = Column(String(255), nullable=True)

    assicurazione_compagnia = Column(String(255), nullable=True)
    assicurazione_polizza = Column(String(255), nullable=True)
    scadenza_assicurazione = Column(Date, nullable=True)
    assicurazione_copertura = Column(Date, nullable=True)

    scadenza_revisione = Column(Date, nullable=True)
    ultima_revisione = Column(Date, nullable=True)
    scadenza_verifica_sicurezza = Column(Date, nullable=True)

    rottamazione_date = Column(Date, nullable=True)
    km_attuali = Column(Integer, nullable=False, default=0)
    stato = Column(String(50), nullable=True, default="operativo")

    tracker_enabled = Column(Boolean, nullable=False, default=False)
    last_latitude = Column(Numeric(10, 7), nullable=True)
    last_longitude = Column(Numeric(10, 7), nullable=True)
    last_position_at = Column(DateTime(timezone=True), nullable=True)

    note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)

    vehicle_type = relationship("VehicleType", back_populates="vehicles")
    revisions = relationship(
        "VehicleRevision",
        back_populates="vehicle",
        cascade="all, delete-orphan",
        order_by="desc(VehicleRevision.data_revisione)",
    )
    assignments = relationship(
        "VehicleAssignment",
        back_populates="vehicle",
        cascade="all, delete-orphan",
        order_by="desc(VehicleAssignment.assegnato_il)",
    )
    incidents = relationship(
        "VehicleIncident",
        back_populates="vehicle",
        cascade="all, delete-orphan",
        order_by="desc(VehicleIncident.data_evento)",
    )
    documents = relationship(
        "VehicleDocument",
        back_populates="vehicle",
        cascade="all, delete-orphan",
        order_by="VehicleDocument.data_scadenza",
    )
    team_links = relationship(
        "AibTeamVehicle",
        back_populates="vehicle",
        cascade="all, delete-orphan",
        order_by="desc(AibTeamVehicle.effective_from)",
    )


class VehicleRevision(Base):
    __tablename__ = "vehicle_revisions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    data_revisione = Column(Date, nullable=False)
    esito = Column(String(255), nullable=False, default="regolare")
    km_rilevati = Column(Integer, nullable=True)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)

    vehicle = relationship("Vehicle", back_populates="revisions")


class VehicleAssignment(Base):
    __tablename__ = "vehicle_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True, index=True)

    km_iniziali = Column(Integer, nullable=False)
    km_finali = Column(Integer, nullable=True)
    assegnato_il = Column(DateTime(timezone=True), nullable=True)
    riconsegnato_il = Column(DateTime(timezone=True), nullable=True)

    documento_assegnazione_numero = Column(String(100), nullable=True)
    documento_assegnazione_data = Column(Date, nullable=True)
    documento_assegnazione_path = Column(String(255), nullable=True)
    documento_restituzione_numero = Column(String(100), nullable=True)
    documento_restituzione_data = Column(Date, nullable=True)
    documento_restituzione_path = Column(String(255), nullable=True)

    stato = Column(String(50), nullable=False, default="assegnato")
    note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)

    vehicle = relationship("Vehicle", back_populates="assignments")
    user = relationship("User", foreign_keys=[user_id])
    employee = relationship("Employee", foreign_keys=[employee_id])


class VehicleIncident(Base):
    __tablename__ = "vehicle_incidents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    data_evento = Column(Date, nullable=False)
    data_chiusura = Column(Date, nullable=True)
    stato = Column(String(50), nullable=False, default="aperto")
    tipo = Column(String(100), nullable=True)
    luogo = Column(String(255), nullable=True)
    descrizione = Column(Text, nullable=True)
    numero_sinistro = Column(String(100), nullable=True)
    importo_danno = Column(Numeric(12, 2), nullable=True)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)

    vehicle = relationship("Vehicle", back_populates="incidents")


class VehicleDocument(Base):
    __tablename__ = "vehicle_documents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    tipo_documento = Column(String(100), nullable=False)
    titolo = Column(String(255), nullable=True)
    numero_documento = Column(String(100), nullable=True)
    data_rilascio = Column(Date, nullable=True)
    data_scadenza = Column(Date, nullable=True)
    percorso_file = Column(String(255), nullable=True)
    stato = Column(String(50), nullable=False, default="attivo")
    note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)

    vehicle = relationship("Vehicle", back_populates="documents")


class AibTeamVehicle(Base):
    __tablename__ = "aib_team_vehicles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    effective_from = Column(Date, nullable=True)
    effective_to = Column(Date, nullable=True)
    team_id = Column(Integer, nullable=False, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)

    vehicle = relationship("Vehicle", back_populates="team_links")
