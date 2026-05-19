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
    JSON,
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
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


class VehicleBrand(Base):
    __tablename__ = "vehicle_brands"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(120), nullable=False, unique=True)
    normalized_name = Column(String(120), nullable=False, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)

    models = relationship("VehicleModel", back_populates="brand", cascade="all, delete-orphan")


class VehicleModel(Base):
    __tablename__ = "vehicle_models"
    __table_args__ = (
        UniqueConstraint("brand_id", "normalized_name", name="uq_vehicle_models_brand_normalized"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    brand_id = Column(Integer, ForeignKey("vehicle_brands.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(160), nullable=False)
    normalized_name = Column(String(160), nullable=False, index=True)
    vehicle_category = Column(
        Enum("Car", "Light_Commercial", "Heavy_Duty", "Motorcycle", name="vehicle_category"),
        nullable=False,
        default="Car",
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)

    brand = relationship("VehicleBrand", back_populates="models")
    trims = relationship("VehicleTrim", back_populates="model", cascade="all, delete-orphan")


class VehicleTrim(Base):
    __tablename__ = "vehicle_trims"
    __table_args__ = (
        UniqueConstraint(
            "model_id",
            "production_year",
            "engine_type",
            "displacement_cc",
            "horsepower_hp",
            name="uq_vehicle_trims_specs",
        ),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    model_id = Column(Integer, ForeignKey("vehicle_models.id", ondelete="CASCADE"), nullable=False, index=True)
    commercial_name = Column(String(180), nullable=True)
    production_year = Column(Integer, nullable=True)
    engine_type = Column(
        Enum("Diesel", "Petrol", "Electric", "Hybrid", "Plug-in", "CNG", name="vehicle_engine_type"),
        nullable=False,
        default="Diesel",
    )
    engine_code = Column(String(80), nullable=True)
    displacement_cc = Column(Integer, nullable=True)
    horsepower_hp = Column(Integer, nullable=True)
    torque_nm = Column(Integer, nullable=True)
    transmission = Column(String(80), nullable=True)
    drive_type = Column(String(80), nullable=True)
    body_style = Column(String(120), nullable=True)
    doors = Column(Integer, nullable=True)
    seats = Column(Integer, nullable=True)
    euro_class = Column(String(30), nullable=True)
    co2_g_km = Column(Integer, nullable=True)
    fuel_consumption_l_100km = Column(Numeric(5, 2), nullable=True)
    wheelbase_mm = Column(Integer, nullable=True)
    length_mm = Column(Integer, nullable=True)
    width_mm = Column(Integer, nullable=True)
    height_mm = Column(Integer, nullable=True)
    gross_weight_kg = Column(Integer, nullable=True)
    tow_capacity_kg = Column(Integer, nullable=True)
    source = Column(String(50), nullable=False, default="manuale")
    raw_payload = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)

    model = relationship("VehicleModel", back_populates="trims")
    vehicles = relationship("Vehicle", back_populates="trim")
    tire_fitments = relationship(
        "VehicleTrimTireFitment",
        back_populates="trim",
        cascade="all, delete-orphan",
        order_by="desc(VehicleTrimTireFitment.is_default)",
    )


class VehicleTrimTireFitment(Base):
    __tablename__ = "vehicle_trim_tire_fitments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    trim_id = Column(Integer, ForeignKey("vehicle_trims.id", ondelete="CASCADE"), nullable=False, index=True)
    position = Column(Enum("front", "rear", "both", name="vehicle_tire_position"), nullable=False, default="both")
    tire_size = Column(String(60), nullable=False)
    rim_size = Column(String(60), nullable=True)
    load_index = Column(String(20), nullable=True)
    speed_rating = Column(String(20), nullable=True)
    pressure_bar = Column(Numeric(4, 2), nullable=True)
    is_default = Column(Boolean, nullable=False, default=False)
    notes = Column(Text, nullable=True)
    source = Column(String(50), nullable=False, default="manuale")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)

    trim = relationship("VehicleTrim", back_populates="tire_fitments")


class VehicleExternalLookup(Base):
    __tablename__ = "vehicle_external_lookups"

    id = Column(Integer, primary_key=True, autoincrement=True)
    provider = Column(String(80), nullable=False, index=True)
    lookup_type = Column(String(40), nullable=False, index=True)
    lookup_key = Column(String(120), nullable=False, index=True)
    normalized_lookup_key = Column(String(120), nullable=False, index=True)
    status = Column(String(40), nullable=False, default="pending")
    http_status = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True, index=True)
    trim_id = Column(Integer, ForeignKey("vehicle_trims.id", ondelete="SET NULL"), nullable=True, index=True)
    raw_payload = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)

    vehicle = relationship("Vehicle")
    trim = relationship("VehicleTrim")


class VehiclePlateProviderSnapshot(Base):
    __tablename__ = "vehicle_plate_provider_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True, index=True)
    trim_id = Column(Integer, ForeignKey("vehicle_trims.id", ondelete="SET NULL"), nullable=True, index=True)
    plate_lookup_id = Column(Integer, ForeignKey("vehicle_external_lookups.id", ondelete="SET NULL"), nullable=True, index=True)
    insurance_lookup_id = Column(Integer, ForeignKey("vehicle_external_lookups.id", ondelete="SET NULL"), nullable=True, index=True)

    provider = Column(String(80), nullable=False, index=True)
    license_plate = Column(String(20), nullable=False, index=True)
    normalized_license_plate = Column(String(20), nullable=False, index=True)
    status = Column(String(40), nullable=False, default="captured", index=True)
    technical_found = Column(Boolean, nullable=False, default=False)
    insurance_found = Column(Boolean, nullable=False, default=False)
    http_status = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)

    technical_payload = Column(JSON, nullable=True)
    insurance_payload = Column(JSON, nullable=True)
    merged_payload = Column(JSON, nullable=True)
    extracted_fields = Column(JSON, nullable=True)

    insurance_company = Column(String(255), nullable=True)
    insurance_expiry = Column(String(40), nullable=True)
    is_insured = Column(Boolean, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)

    vehicle = relationship("Vehicle")
    trim = relationship("VehicleTrim")
    plate_lookup = relationship("VehicleExternalLookup", foreign_keys=[plate_lookup_id])
    insurance_lookup = relationship("VehicleExternalLookup", foreign_keys=[insurance_lookup_id])


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    trim_id = Column(Integer, ForeignKey("vehicle_trims.id", ondelete="RESTRICT"), nullable=False, index=True)
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

    trim = relationship("VehicleTrim", back_populates="vehicles")
    vehicle_type = relationship("VehicleType", back_populates="vehicles")
    groups = relationship(
        "FleetGroupMember",
        back_populates="vehicle",
        cascade="all, delete-orphan",
        order_by="FleetGroupMember.id.asc()",
    )
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
    insurance_records = relationship(
        "VehicleInsuranceRecord",
        back_populates="vehicle",
        cascade="all, delete-orphan",
        order_by="desc(VehicleInsuranceRecord.data_scadenza)",
    )
    usage_logs = relationship(
        "VehicleUsageLog",
        back_populates="vehicle",
        cascade="all, delete-orphan",
        order_by="desc(VehicleUsageLog.started_at)",
    )
    alerts = relationship(
        "VehicleAlert",
        back_populates="vehicle",
        cascade="all, delete-orphan",
        order_by="desc(VehicleAlert.created_at)",
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
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True)

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
    organization = relationship("Organization", foreign_keys=[organization_id])


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


class FleetGroup(Base):
    __tablename__ = "fleet_groups"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False, unique=True)
    code = Column(String(50), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    scope = Column(String(50), nullable=False, default="operativo")
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)
    province_code = Column(String(10), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)

    organization = relationship("Organization")
    members = relationship(
        "FleetGroupMember",
        back_populates="group",
        cascade="all, delete-orphan",
        order_by="FleetGroupMember.id.asc()",
    )


class FleetGroupMember(Base):
    __tablename__ = "fleet_group_members"

    id = Column(Integer, primary_key=True, autoincrement=True)
    group_id = Column(Integer, ForeignKey("fleet_groups.id", ondelete="CASCADE"), nullable=False, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)

    group = relationship("FleetGroup", back_populates="members")
    vehicle = relationship("Vehicle", back_populates="groups")


class VehicleInsuranceRecord(Base):
    __tablename__ = "vehicle_insurance_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey("fleet_groups.id", ondelete="SET NULL"), nullable=True, index=True)
    source_type = Column(String(30), nullable=False, default="manuale")
    compagnia = Column(String(255), nullable=False)
    broker = Column(String(255), nullable=True)
    package_name = Column(String(255), nullable=True)
    numero_polizza = Column(String(100), nullable=True)
    copertura_dal = Column(Date, nullable=True)
    copertura_al = Column(Date, nullable=True)
    data_scadenza = Column(Date, nullable=False)
    data_scadenza_provider = Column(Date, nullable=True)
    tolleranza_giorni = Column(Integer, nullable=False, default=0)
    provider_payload = Column(JSON, nullable=True)
    channels_ready = Column(JSON, nullable=True)
    is_current = Column(Boolean, nullable=False, default=True)
    note = Column(Text, nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)

    vehicle = relationship("Vehicle", back_populates="insurance_records")
    group = relationship("FleetGroup")
    created_by_user = relationship("User", foreign_keys=[created_by_user_id])


class VehicleUsageLog(Base):
    __tablename__ = "vehicle_usage_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    assignment_id = Column(Integer, ForeignKey("vehicle_logs.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True, index=True)

    started_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)
    km_partenza = Column(Integer, nullable=False)
    km_rientro = Column(Integer, nullable=True)
    note_presa = Column(Text, nullable=True)
    note_rientro = Column(Text, nullable=True)
    issue_flags = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)

    vehicle = relationship("Vehicle", back_populates="usage_logs")
    assignment = relationship("VehicleAssignment")
    user = relationship("User", foreign_keys=[user_id])
    employee = relationship("Employee", foreign_keys=[employee_id])


class VehicleAlert(Base):
    __tablename__ = "vehicle_alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    assignment_id = Column(Integer, ForeignKey("vehicle_logs.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True, index=True)

    alert_type = Column(String(50), nullable=False, default="segnalazione")
    severity = Column(String(50), nullable=False, default="media")
    status = Column(String(50), nullable=False, default="aperto")
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    location_text = Column(String(255), nullable=True)
    latitude = Column(Numeric(10, 7), nullable=True)
    longitude = Column(Numeric(10, 7), nullable=True)
    province_code = Column(String(10), nullable=True)
    event_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)

    vehicle = relationship("Vehicle", back_populates="alerts")
    assignment = relationship("VehicleAssignment")
    user = relationship("User", foreign_keys=[user_id])
    employee = relationship("Employee", foreign_keys=[employee_id])
