"""
Router API per modulo Risorse Umane (HR).
CRUD dipendenti, qualifiche, documenti.
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.employee import Employee, EmployeeQualification
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
    EmployeeListResponse,
    QualificationCreate,
    QualificationResponse,
)

router = APIRouter()


@router.get("/employees", response_model=EmployeeListResponse)
async def list_employees(
    search: Optional[str] = Query(None, description="Cerca per nome, cognome o CF"),
    stato: Optional[str] = Query(None, description="Filtra per stato"),
    organization_id: Optional[int] = Query(None, description="Filtra per organizzazione"),
    tipo_contratto: Optional[str] = Query(None, description="Filtra per tipo contratto"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lista dipendenti con ricerca, filtri multipli e paginazione server-side.
    """
    query = db.query(Employee)

    if search:
        term = f"%{search}%"
        query = query.filter(
            (Employee.nome.ilike(term)) |
            (Employee.cognome.ilike(term)) |
            (Employee.codice_fiscale.ilike(term)) |
            (Employee.matricola.ilike(term)) |
            (Employee.email_istituzionale.ilike(term))
        )
    if stato:
        query = query.filter(Employee.stato == stato)
    if organization_id:
        query = query.filter(Employee.organization_id == organization_id)
    if tipo_contratto:
        query = query.filter(Employee.tipo_contratto == tipo_contratto)

    total = query.count()
    offset = (page - 1) * page_size
    employees = query.order_by(Employee.cognome, Employee.nome).offset(offset).limit(page_size).all()

    return EmployeeListResponse(
        items=employees,
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size,
    )


@router.get("/employees/{employee_id}", response_model=EmployeeResponse)
async def get_employee(
    employee_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fascicolo personale completo del dipendente."""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Dipendente non trovato")
    return employee


@router.post("/employees", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(
    data: EmployeeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Inserimento nuovo dipendente."""
    # Verifica CF univoco
    existing = db.query(Employee).filter(Employee.codice_fiscale == data.codice_fiscale.upper()).first()
    if existing:
        raise HTTPException(status_code=409, detail="Codice fiscale già presente")

    employee = Employee(**data.model_dump())
    employee.codice_fiscale = employee.codice_fiscale.upper()
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


@router.put("/employees/{employee_id}", response_model=EmployeeResponse)
async def update_employee(
    employee_id: int,
    data: EmployeeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Aggiornamento dati dipendente."""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Dipendente non trovato")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(employee, field, value)

    db.commit()
    db.refresh(employee)
    return employee


# --- Qualifiche ---

@router.get("/employees/{employee_id}/qualifications", response_model=list[QualificationResponse])
async def list_qualifications(
    employee_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lista qualifiche del dipendente."""
    return db.query(EmployeeQualification).filter(
        EmployeeQualification.employee_id == employee_id
    ).order_by(EmployeeQualification.data_conseguimento.desc()).all()


@router.post("/employees/{employee_id}/qualifications", response_model=QualificationResponse, status_code=201)
async def add_qualification(
    employee_id: int,
    data: QualificationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Aggiunge una qualifica al dipendente."""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Dipendente non trovato")

    qual = EmployeeQualification(employee_id=employee_id, **data.model_dump())
    db.add(qual)
    db.commit()
    db.refresh(qual)
    return qual
