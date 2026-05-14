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


class FleetVehicleListItem(BaseModel):
    id: int
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
    open_incidents: int = 0


class FleetVehicleDetailResponse(BaseModel):
    id: int
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
    revisions: list[FleetVehicleRevisionResponse] = Field(default_factory=list)
    assignments: list[FleetVehicleAssignmentResponse] = Field(default_factory=list)
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
