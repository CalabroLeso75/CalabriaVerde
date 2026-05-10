"""
Schemi Pydantic per il modulo Risorse Umane (HR).
"""
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field


class EmployeeCreate(BaseModel):
    """Schema per creazione dipendente."""
    codice_fiscale: str = Field(min_length=16, max_length=16)
    nome: str = Field(min_length=1, max_length=100)
    cognome: str = Field(min_length=1, max_length=100)

    # Anagrafica
    data_nascita: Optional[date] = None
    luogo_nascita: Optional[str] = None
    provincia_nascita: Optional[str] = None
    sesso: Optional[str] = None

    # Residenza
    indirizzo_residenza: Optional[str] = None
    citta_residenza: Optional[str] = None
    provincia_residenza: Optional[str] = None
    cap_residenza: Optional[str] = None

    # Domicilio
    indirizzo_domicilio: Optional[str] = None
    citta_domicilio: Optional[str] = None
    provincia_domicilio: Optional[str] = None
    cap_domicilio: Optional[str] = None

    # Contatti
    telefono_personale: Optional[str] = None
    telefono_lavoro: Optional[str] = None
    email_personale: Optional[str] = None
    email_istituzionale: Optional[str] = None

    # Contratto
    tipo_contratto: Optional[str] = None
    data_assunzione: Optional[date] = None
    livello_inquadramento: Optional[str] = None
    area_contrattuale: Optional[str] = None
    matricola: Optional[str] = None

    # Organizzazione
    organization_id: Optional[int] = None
    settore: Optional[str] = None
    ufficio: Optional[str] = None
    mansione: Optional[str] = None

    # Patenti
    patente_tipo: Optional[str] = None
    patente_scadenza: Optional[date] = None

    note: Optional[str] = None


class EmployeeUpdate(BaseModel):
    """Schema per aggiornamento dipendente (tutti i campi opzionali)."""
    nome: Optional[str] = None
    cognome: Optional[str] = None
    data_nascita: Optional[date] = None
    luogo_nascita: Optional[str] = None
    provincia_nascita: Optional[str] = None
    sesso: Optional[str] = None

    indirizzo_residenza: Optional[str] = None
    citta_residenza: Optional[str] = None
    provincia_residenza: Optional[str] = None
    cap_residenza: Optional[str] = None

    indirizzo_domicilio: Optional[str] = None
    citta_domicilio: Optional[str] = None
    provincia_domicilio: Optional[str] = None
    cap_domicilio: Optional[str] = None

    telefono_personale: Optional[str] = None
    telefono_lavoro: Optional[str] = None
    email_personale: Optional[str] = None
    email_istituzionale: Optional[str] = None

    tipo_contratto: Optional[str] = None
    data_assunzione: Optional[date] = None
    data_cessazione: Optional[date] = None
    livello_inquadramento: Optional[str] = None
    area_contrattuale: Optional[str] = None
    matricola: Optional[str] = None

    organization_id: Optional[int] = None
    settore: Optional[str] = None
    ufficio: Optional[str] = None
    mansione: Optional[str] = None
    stato: Optional[str] = None

    patente_tipo: Optional[str] = None
    patente_scadenza: Optional[date] = None

    note: Optional[str] = None


class QualificationCreate(BaseModel):
    """Schema per aggiunta qualifica."""
    tipo: str
    nome: str
    ente_rilascio: Optional[str] = None
    numero_documento: Optional[str] = None
    data_conseguimento: Optional[date] = None
    data_scadenza: Optional[date] = None
    note: Optional[str] = None


class QualificationResponse(BaseModel):
    """Risposta qualifica."""
    id: int
    tipo: str
    nome: str
    ente_rilascio: Optional[str] = None
    numero_documento: Optional[str] = None
    data_conseguimento: Optional[date] = None
    data_scadenza: Optional[date] = None
    is_valid: bool = True
    note: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EmployeeResponse(BaseModel):
    """Risposta completa dipendente."""
    id: int
    codice_fiscale: str
    nome: str
    cognome: str
    data_nascita: Optional[date] = None
    luogo_nascita: Optional[str] = None
    sesso: Optional[str] = None

    indirizzo_residenza: Optional[str] = None
    citta_residenza: Optional[str] = None
    provincia_residenza: Optional[str] = None

    telefono_personale: Optional[str] = None
    telefono_lavoro: Optional[str] = None
    email_personale: Optional[str] = None
    email_istituzionale: Optional[str] = None

    tipo_contratto: Optional[str] = None
    data_assunzione: Optional[date] = None
    data_cessazione: Optional[date] = None
    livello_inquadramento: Optional[str] = None
    matricola: Optional[str] = None
    organization_id: Optional[int] = None
    settore: Optional[str] = None
    mansione: Optional[str] = None
    stato: Optional[str] = None

    patente_tipo: Optional[str] = None
    patente_scadenza: Optional[date] = None

    qualifications: List[QualificationResponse] = []
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
