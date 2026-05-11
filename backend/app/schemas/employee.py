"""Schemi Pydantic per il modulo Risorse Umane (HR)."""
from datetime import datetime, date
from typing import Optional, List, Dict
from pydantic import BaseModel, Field


class EmployeeCreate(BaseModel):
    """Schema per creazione dipendente."""
    codice_fiscale: str = Field(min_length=16, max_length=16)
    nome: str = Field(min_length=1, max_length=100)
    cognome: str = Field(min_length=1, max_length=100)
    tipo: str = "interno"

    # Anagrafica
    data_nascita: Optional[date] = None
    luogo_nascita: Optional[str] = None
    provincia_nascita: Optional[str] = None
    luogo_nascita_estero: Optional[str] = None
    genere: Optional[str] = None

    # Contatti
    telefono_personale: Optional[str] = None
    telefono_secondario: Optional[str] = None
    telefono_lavoro: Optional[str] = None
    email_personale: Optional[str] = None
    email_istituzionale: Optional[str] = None
    pec: Optional[str] = None

    # Contratto
    tipo_contratto: Optional[str] = None
    data_assunzione: Optional[date] = None
    data_fine_contratto: Optional[date] = None
    numero_matricola: Optional[str] = None
    livello_inquadramento: Optional[str] = None
    ccnl_code: Optional[str] = None
    ccnl_comparto: Optional[str] = None
    macro_inquadramento: Optional[str] = None
    profilo_professionale: Optional[str] = None
    categoria_inquadramento: Optional[str] = None
    posizione_economica: Optional[str] = None
    orario_settimanale: Optional[int] = None
    regime_orario: Optional[str] = None
    scatti_anzianita: Optional[int] = None
    data_prossimo_scatto: Optional[date] = None
    integrativo_regionale: bool = False
    integrativo_regionale_note: Optional[str] = None
    applicazione_parziale_contratto: bool = False
    applicazione_parziale_note: Optional[str] = None
    provenienza_assorbimento: Optional[str] = None
    ente_provenienza: Optional[str] = None

    # Organizzazione
    organization_id: Optional[int] = None
    mansione: Optional[str] = None
    stato: str = "in_servizio"

    # Flag operativi
    is_aib_qualificato: bool = False
    is_dos: bool = False
    is_emergency_available: bool = False
    is_emergency_coordinator: bool = False
    is_operations_room_manager: bool = False
    is_operations_room_operator: bool = False
    is_mechanical_operator: bool = False
    is_aib_pc_operator: bool = False
    is_pc_operator: bool = False
    is_driver: bool = False

    patenti: Optional[List[str]] = None
    abilitazioni: Optional[List[str]] = None
    documenti_scadenza: Optional[Dict[str, str]] = None

    note: Optional[str] = None


class EmployeeUpdate(BaseModel):
    """Schema per aggiornamento dipendente (tutti i campi opzionali)."""
    nome: Optional[str] = None
    cognome: Optional[str] = None
    data_nascita: Optional[date] = None
    luogo_nascita: Optional[str] = None
    provincia_nascita: Optional[str] = None
    luogo_nascita_estero: Optional[str] = None
    genere: Optional[str] = None

    telefono_personale: Optional[str] = None
    telefono_secondario: Optional[str] = None
    telefono_lavoro: Optional[str] = None
    email_personale: Optional[str] = None
    email_istituzionale: Optional[str] = None
    pec: Optional[str] = None

    tipo: Optional[str] = None
    tipo_contratto: Optional[str] = None
    data_assunzione: Optional[date] = None
    data_fine_contratto: Optional[date] = None
    numero_matricola: Optional[str] = None
    livello_inquadramento: Optional[str] = None
    ccnl_code: Optional[str] = None
    ccnl_comparto: Optional[str] = None
    macro_inquadramento: Optional[str] = None
    profilo_professionale: Optional[str] = None
    categoria_inquadramento: Optional[str] = None
    posizione_economica: Optional[str] = None
    orario_settimanale: Optional[int] = None
    regime_orario: Optional[str] = None
    scatti_anzianita: Optional[int] = None
    data_prossimo_scatto: Optional[date] = None
    integrativo_regionale: Optional[bool] = None
    integrativo_regionale_note: Optional[str] = None
    applicazione_parziale_contratto: Optional[bool] = None
    applicazione_parziale_note: Optional[str] = None
    provenienza_assorbimento: Optional[str] = None
    ente_provenienza: Optional[str] = None

    organization_id: Optional[int] = None
    mansione: Optional[str] = None
    stato: Optional[str] = None

    is_aib_qualificato: Optional[bool] = None
    is_dos: Optional[bool] = None
    is_emergency_available: Optional[bool] = None
    is_emergency_coordinator: Optional[bool] = None
    is_operations_room_manager: Optional[bool] = None
    is_operations_room_operator: Optional[bool] = None
    is_mechanical_operator: Optional[bool] = None
    is_aib_pc_operator: Optional[bool] = None
    is_pc_operator: Optional[bool] = None
    is_driver: Optional[bool] = None

    patenti: Optional[List[str]] = None
    abilitazioni: Optional[List[str]] = None
    documenti_scadenza: Optional[Dict[str, str]] = None

    note: Optional[str] = None


class QualificationCreate(BaseModel):
    """Schema per aggiunta qualifica."""
    tipo_qualifica: str
    is_attiva: bool = True
    ente_rilascio: Optional[str] = None
    numero_documento: Optional[str] = None
    data_conseguimento: Optional[date] = None
    data_scadenza: Optional[date] = None
    payload: Optional[Dict] = None
    note: Optional[str] = None


class QualificationResponse(BaseModel):
    """Risposta qualifica."""
    id: int
    tipo_qualifica: str
    is_attiva: bool = True
    ente_rilascio: Optional[str] = None
    numero_documento: Optional[str] = None
    data_conseguimento: Optional[date] = None
    data_scadenza: Optional[date] = None
    payload: Optional[Dict] = None
    note: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EmployeeResponse(BaseModel):
    """Risposta completa dipendente."""
    id: int
    codice_fiscale: str
    nome: str
    cognome: str
    tipo: str
    data_nascita: Optional[date] = None
    luogo_nascita: Optional[str] = None
    provincia_nascita: Optional[str] = None
    luogo_nascita_estero: Optional[str] = None
    genere: Optional[str] = None

    telefono_personale: Optional[str] = None
    telefono_secondario: Optional[str] = None
    telefono_lavoro: Optional[str] = None
    email_personale: Optional[str] = None
    email_istituzionale: Optional[str] = None
    pec: Optional[str] = None

    tipo_contratto: Optional[str] = None
    data_assunzione: Optional[date] = None
    data_fine_contratto: Optional[date] = None
    numero_matricola: Optional[str] = None
    livello_inquadramento: Optional[str] = None
    ccnl_code: Optional[str] = None
    ccnl_comparto: Optional[str] = None
    macro_inquadramento: Optional[str] = None
    profilo_professionale: Optional[str] = None
    categoria_inquadramento: Optional[str] = None
    posizione_economica: Optional[str] = None
    orario_settimanale: Optional[int] = None
    regime_orario: Optional[str] = None
    scatti_anzianita: Optional[int] = None
    data_prossimo_scatto: Optional[date] = None
    integrativo_regionale: bool = False
    integrativo_regionale_note: Optional[str] = None
    applicazione_parziale_contratto: bool = False
    applicazione_parziale_note: Optional[str] = None
    provenienza_assorbimento: Optional[str] = None
    ente_provenienza: Optional[str] = None
    organization_id: Optional[int] = None
    mansione: Optional[str] = None
    stato: str

    stato_quiescenza: Optional[str] = None
    is_aib_qualificato: bool = False
    is_dos: bool = False
    is_emergency_available: bool = False
    is_emergency_coordinator: bool = False
    is_operations_room_manager: bool = False
    is_operations_room_operator: bool = False
    is_mechanical_operator: bool = False
    is_aib_pc_operator: bool = False
    is_pc_operator: bool = False
    is_driver: bool = False

    patenti: Optional[List[str]] = None
    abilitazioni: Optional[List[str]] = None
    documenti_scadenza: Optional[Dict[str, str]] = None

    qualifiche: List[QualificationResponse] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    note: Optional[str] = None

    class Config:
        from_attributes = True


class EmployeeListResponse(BaseModel):
    """Risposta paginata per lista dipendenti."""
    items: List[EmployeeResponse]
    total: int
    page: int
    page_size: int
    pages: int
