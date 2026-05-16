from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class FleetVehicleTypeResponse(BaseModel):
    id: int
    name: str
    patente: Optional[str] = None
    revisione: Optional[str] = None
    assicurazione: Optional[str] = None
    tipo_abilitazione: Optional[str] = None

    class Config:
        from_attributes = True


class FleetVehicleBrandResponse(BaseModel):
    id: int
    name: str
    normalized_name: str

    class Config:
        from_attributes = True


class FleetVehicleModelResponse(BaseModel):
    id: int
    brand_id: int
    name: str
    normalized_name: str
    vehicle_category: str
    brand: Optional[FleetVehicleBrandResponse] = None

    class Config:
        from_attributes = True


class FleetVehicleTireFitmentResponse(BaseModel):
    id: int
    trim_id: int
    position: str
    tire_size: str
    rim_size: Optional[str] = None
    load_index: Optional[str] = None
    speed_rating: Optional[str] = None
    pressure_bar: Optional[Decimal] = None
    is_default: bool = False
    notes: Optional[str] = None
    source: str = "manuale"

    class Config:
        from_attributes = True


class FleetVehicleTireFitmentCreate(BaseModel):
    position: str = "both"
    tire_size: str
    rim_size: Optional[str] = None
    load_index: Optional[str] = None
    speed_rating: Optional[str] = None
    pressure_bar: Optional[Decimal] = None
    is_default: bool = False
    notes: Optional[str] = None
    source: str = "manuale"


class FleetVehicleTrimResponse(BaseModel):
    id: int
    model_id: int
    commercial_name: Optional[str] = None
    production_year: Optional[int] = None
    engine_type: str
    engine_code: Optional[str] = None
    displacement_cc: Optional[int] = None
    horsepower_hp: Optional[int] = None
    torque_nm: Optional[int] = None
    transmission: Optional[str] = None
    drive_type: Optional[str] = None
    body_style: Optional[str] = None
    doors: Optional[int] = None
    seats: Optional[int] = None
    euro_class: Optional[str] = None
    co2_g_km: Optional[int] = None
    fuel_consumption_l_100km: Optional[Decimal] = None
    wheelbase_mm: Optional[int] = None
    length_mm: Optional[int] = None
    width_mm: Optional[int] = None
    height_mm: Optional[int] = None
    gross_weight_kg: Optional[int] = None
    tow_capacity_kg: Optional[int] = None
    source: str = "manuale"
    model: Optional[FleetVehicleModelResponse] = None
    tire_fitments: list[FleetVehicleTireFitmentResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


class FleetVehicleTrimCreate(BaseModel):
    brand_name: str
    model_name: str
    vehicle_category: str = "Car"
    commercial_name: Optional[str] = None
    production_year: Optional[int] = None
    engine_type: str = "Diesel"
    engine_code: Optional[str] = None
    displacement_cc: Optional[int] = None
    horsepower_hp: Optional[int] = None
    torque_nm: Optional[int] = None
    transmission: Optional[str] = None
    drive_type: Optional[str] = None
    body_style: Optional[str] = None
    doors: Optional[int] = None
    seats: Optional[int] = None
    euro_class: Optional[str] = None
    co2_g_km: Optional[int] = None
    fuel_consumption_l_100km: Optional[Decimal] = None
    wheelbase_mm: Optional[int] = None
    length_mm: Optional[int] = None
    width_mm: Optional[int] = None
    height_mm: Optional[int] = None
    gross_weight_kg: Optional[int] = None
    tow_capacity_kg: Optional[int] = None
    tire_fitments: list[FleetVehicleTireFitmentCreate] = Field(default_factory=list)
    source: str = "manuale"


class FleetPhysicalVehicleCreate(BaseModel):
    license_plate: str
    vin_code: Optional[str] = None
    status: str = "Active"
    trim_id: Optional[int] = None
    trim: Optional[FleetVehicleTrimCreate] = None
    allow_external_lookup: bool = False
    km_attuali: int = 0
    organization_id: Optional[int] = None
    vehicle_type_id: Optional[int] = None
    color: Optional[str] = None
    ownership_type: Optional[str] = None
    note: Optional[str] = None


class FleetPhysicalVehicleCreateResponse(BaseModel):
    id: int
    license_plate: str
    trim_id: int
    brand_name: str
    model_name: str
    created_from: str


class FleetCatalogProviderStatusResponse(BaseModel):
    code: str
    label: str
    lookup_type: str
    enabled: bool
    configured: bool
    needs_api_key: bool
    note: str


class FleetCatalogExternalLookupRequest(BaseModel):
    lookup_type: str = Field(pattern="^(plate|vin)$")
    lookup_key: str
    persist: bool = True


class FleetCatalogExternalLookupResponse(BaseModel):
    provider: str
    lookup_type: str
    lookup_key: str
    status: str
    error_message: Optional[str] = None
    http_status: Optional[int] = None
    trim: Optional[FleetVehicleTrimResponse] = None
    source_notes: list[str] = Field(default_factory=list)


class FleetVehicleRevisionResponse(BaseModel):
    id: int
    data_revisione: date
    esito: str
    km_rilevati: Optional[int] = None
    note: Optional[str] = None

    class Config:
        from_attributes = True


class FleetVehicleAssignmentResponse(BaseModel):
    id: int
    vehicle_id: int
    user_id: Optional[int] = None
    employee_id: Optional[int] = None
    organization_id: Optional[int] = None
    km_iniziali: int
    km_finali: Optional[int] = None
    assegnato_il: Optional[datetime] = None
    riconsegnato_il: Optional[datetime] = None
    documento_assegnazione_numero: Optional[str] = None
    documento_assegnazione_data: Optional[date] = None
    documento_restituzione_numero: Optional[str] = None
    documento_restituzione_data: Optional[date] = None
    stato: str
    note: Optional[str] = None
    user_display_name: Optional[str] = None
    employee_display_name: Optional[str] = None
    organization_display_name: Optional[str] = None


class FleetVehicleIncidentResponse(BaseModel):
    id: int
    data_evento: date
    data_chiusura: Optional[date] = None
    stato: str
    tipo: Optional[str] = None
    luogo: Optional[str] = None
    descrizione: Optional[str] = None
    numero_sinistro: Optional[str] = None
    importo_danno: Optional[Decimal] = None
    note: Optional[str] = None

    class Config:
        from_attributes = True


class FleetVehicleDocumentResponse(BaseModel):
    id: int
    tipo_documento: str
    titolo: Optional[str] = None
    numero_documento: Optional[str] = None
    data_rilascio: Optional[date] = None
    data_scadenza: Optional[date] = None
    percorso_file: Optional[str] = None
    stato: str
    note: Optional[str] = None

    class Config:
        from_attributes = True


class FleetTeamLinkResponse(BaseModel):
    id: int
    team_id: int
    effective_from: Optional[date] = None
    effective_to: Optional[date] = None

    class Config:
        from_attributes = True


class FleetGroupResponse(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str] = None
    scope: str
    organization_id: Optional[int] = None
    province_code: Optional[str] = None
    is_active: bool = True
    vehicle_count: int = 0


class FleetGroupCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    scope: str = "operativo"
    organization_id: Optional[int] = None
    province_code: Optional[str] = None
    vehicle_ids: list[int] = Field(default_factory=list)


class FleetBulkGroupMembershipUpdate(BaseModel):
    vehicle_ids: list[int] = Field(default_factory=list)


class FleetVehicleInsuranceRecordResponse(BaseModel):
    id: int
    vehicle_id: int
    group_id: Optional[int] = None
    source_type: str
    compagnia: str
    broker: Optional[str] = None
    package_name: Optional[str] = None
    numero_polizza: Optional[str] = None
    copertura_dal: Optional[date] = None
    copertura_al: Optional[date] = None
    data_scadenza: date
    channels_ready: Optional[list[str]] = None
    is_current: bool = True
    note: Optional[str] = None

    class Config:
        from_attributes = True


class FleetVehicleInsuranceCreate(BaseModel):
    source_type: str = "manuale"
    compagnia: str
    broker: Optional[str] = None
    package_name: Optional[str] = None
    numero_polizza: Optional[str] = None
    copertura_dal: Optional[date] = None
    copertura_al: Optional[date] = None
    data_scadenza: date
    channels_ready: list[str] = Field(default_factory=list)
    note: Optional[str] = None


class FleetBulkInsuranceUpdate(BaseModel):
    group_id: int
    source_type: str = "manuale"
    compagnia: str
    broker: Optional[str] = None
    package_name: Optional[str] = None
    copertura_dal: Optional[date] = None
    copertura_al: Optional[date] = None
    data_scadenza: date
    note: Optional[str] = None


class FleetVehicleRevisionCreate(BaseModel):
    data_revisione: date
    esito: str = "regolare"
    km_rilevati: Optional[int] = None
    note: Optional[str] = None
    scadenza_revisione: Optional[date] = None
    scadenza_verifica_sicurezza: Optional[date] = None


class FleetBulkRevisionUpdate(BaseModel):
    group_id: int
    data_revisione: Optional[date] = None
    esito: str = "pianificata"
    note: Optional[str] = None
    scadenza_revisione: date
    scadenza_verifica_sicurezza: Optional[date] = None


class FleetVehicleAssignmentCreate(BaseModel):
    employee_id: Optional[int] = None
    user_id: Optional[int] = None
    organization_id: Optional[int] = None
    km_iniziali: int
    assegnato_il: Optional[datetime] = None
    riconsegnato_il: Optional[datetime] = None
    documento_assegnazione_numero: Optional[str] = None
    documento_assegnazione_data: Optional[date] = None
    documento_restituzione_numero: Optional[str] = None
    documento_restituzione_data: Optional[date] = None
    stato: str = "assegnato"
    note: Optional[str] = None
    note_responsabile: Optional[str] = None
    note_assegnatario: Optional[str] = None


class FleetVehicleAssignmentExtensionCreate(BaseModel):
    riconsegnato_il: datetime
    note: Optional[str] = None


class FleetVehicleAssignmentReturn(BaseModel):
    km_finali: int
    riconsegnato_il: Optional[datetime] = None
    documento_restituzione_numero: Optional[str] = None
    documento_restituzione_data: Optional[date] = None
    note: Optional[str] = None
    stato: str = "restituito"


class FleetVehicleUsageLogResponse(BaseModel):
    id: int
    vehicle_id: int
    assignment_id: Optional[int] = None
    user_id: Optional[int] = None
    employee_id: Optional[int] = None
    started_at: datetime
    ended_at: Optional[datetime] = None
    km_partenza: int
    km_rientro: Optional[int] = None
    note_presa: Optional[str] = None
    note_rientro: Optional[str] = None
    issue_flags: list[str] = Field(default_factory=list)
    actor_display_name: Optional[str] = None

    class Config:
        from_attributes = True


class FleetVehicleUsageCreate(BaseModel):
    assignment_id: Optional[int] = None
    employee_id: Optional[int] = None
    user_id: Optional[int] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    km_partenza: int
    km_rientro: Optional[int] = None
    note_presa: Optional[str] = None
    note_rientro: Optional[str] = None
    issue_flags: list[str] = Field(default_factory=list)


class FleetVehicleAlertResponse(BaseModel):
    id: int
    vehicle_id: int
    assignment_id: Optional[int] = None
    user_id: Optional[int] = None
    employee_id: Optional[int] = None
    alert_type: str
    severity: str
    status: str
    title: str
    description: str
    location_text: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    province_code: Optional[str] = None
    event_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    actor_display_name: Optional[str] = None

    class Config:
        from_attributes = True


class FleetVehicleAlertCreate(BaseModel):
    assignment_id: Optional[int] = None
    employee_id: Optional[int] = None
    user_id: Optional[int] = None
    alert_type: str = "segnalazione"
    severity: str = "media"
    title: str
    description: str
    location_text: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    province_code: Optional[str] = None
    event_at: Optional[datetime] = None


class CommunicationTargetResponse(BaseModel):
    id: int
    module_scope: str
    compartment_scope: Optional[str] = None
    role_label: str
    province_code: Optional[str] = None
    organization_id: Optional[int] = None
    user_id: Optional[int] = None
    display_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    preferred_channels: list[str] = Field(default_factory=list)
    is_active: bool = True
    note: Optional[str] = None

    class Config:
        from_attributes = True


class CommunicationTargetCreate(BaseModel):
    module_scope: str = "fleet"
    compartment_scope: Optional[str] = "parco_macchine"
    role_label: str
    province_code: Optional[str] = None
    organization_id: Optional[int] = None
    user_id: Optional[int] = None
    display_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    preferred_channels: list[str] = Field(default_factory=lambda: ["sistema"])
    is_active: bool = True
    note: Optional[str] = None


class CommunicationRecipientResponse(BaseModel):
    id: int
    recipient_label: str
    channel: str
    destination: Optional[str] = None
    delivery_status: str

    class Config:
        from_attributes = True


class CommunicationLogResponse(BaseModel):
    id: int
    module_scope: str
    compartment_scope: Optional[str] = None
    event_type: str
    channel: str
    subject: str
    message: str
    related_table: Optional[str] = None
    related_id: Optional[int] = None
    status: str
    created_at: Optional[datetime] = None
    recipients: list[CommunicationRecipientResponse] = Field(default_factory=list)


class FleetVehicleListItem(BaseModel):
    id: int
    trim_id: int
    targa: str
    marca: str
    modello: str
    tipo: str
    stato: Optional[str] = None
    km_attuali: int
    scadenza_assicurazione: Optional[date] = None
    scadenza_revisione: Optional[date] = None
    ultima_revisione: Optional[date] = None
    localizzazione_corrente: Optional[str] = None
    vehicle_type_name: Optional[str] = None
    current_assignee: Optional[str] = None
    current_assignment_unit: Optional[str] = None
    current_user_name: Optional[str] = None
    open_incidents: int = 0


class FleetAssignmentUnitResponse(BaseModel):
    id: int
    code: str
    name: str
    type: str
    province: Optional[str] = None


class FleetVehicleDetailResponse(BaseModel):
    id: int
    trim_id: int
    vehicle_type_id: Optional[int] = None
    organization_id: Optional[int] = None
    targa: str
    marca: str
    modello: str
    tipo: str
    immatricolazione_date: Optional[date] = None
    immatricolazione_mese: Optional[int] = None
    immatricolazione_anno: Optional[int] = None
    numero_telaio: Optional[str] = None
    alimentazione: Optional[str] = None
    euro_classe: Optional[str] = None
    colore: Optional[str] = None
    proprieta_tipo: Optional[str] = None
    localizzazione_corrente: Optional[str] = None
    assicurazione_compagnia: Optional[str] = None
    assicurazione_polizza: Optional[str] = None
    scadenza_assicurazione: Optional[date] = None
    assicurazione_copertura: Optional[date] = None
    scadenza_revisione: Optional[date] = None
    ultima_revisione: Optional[date] = None
    scadenza_verifica_sicurezza: Optional[date] = None
    rottamazione_date: Optional[date] = None
    km_attuali: int
    stato: Optional[str] = None
    tracker_enabled: bool = False
    last_latitude: Optional[Decimal] = None
    last_longitude: Optional[Decimal] = None
    last_position_at: Optional[datetime] = None
    note: Optional[str] = None
    vehicle_type: Optional[FleetVehicleTypeResponse] = None
    groups: list[FleetGroupResponse] = Field(default_factory=list)
    insurance_records: list[FleetVehicleInsuranceRecordResponse] = Field(default_factory=list)
    revisions: list[FleetVehicleRevisionResponse] = Field(default_factory=list)
    assignments: list[FleetVehicleAssignmentResponse] = Field(default_factory=list)
    usage_logs: list[FleetVehicleUsageLogResponse] = Field(default_factory=list)
    alerts: list[FleetVehicleAlertResponse] = Field(default_factory=list)
    incidents: list[FleetVehicleIncidentResponse] = Field(default_factory=list)
    documents: list[FleetVehicleDocumentResponse] = Field(default_factory=list)
    team_links: list[FleetTeamLinkResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


class FleetVehicleListResponse(BaseModel):
    items: list[FleetVehicleListItem]
    total: int
    page: int
    page_size: int
    pages: int


class FleetSummaryResponse(BaseModel):
    total_vehicles: int
    operational_vehicles: int
    insurance_expiring_30d: int
    revision_expiring_30d: int
    active_assignments: int
    open_incidents: int
    tracked_vehicles: int
