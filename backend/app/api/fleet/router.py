from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.fleet import (
    Vehicle,
    VehicleAssignment,
    VehicleDocument,
    VehicleIncident,
    VehicleRevision,
    VehicleType,
)
from app.models.user import User
from app.schemas.fleet import (
    FleetSummaryResponse,
    FleetVehicleAssignmentResponse,
    FleetVehicleDetailResponse,
    FleetVehicleDocumentResponse,
    FleetVehicleIncidentResponse,
    FleetVehicleListItem,
    FleetVehicleListResponse,
    FleetVehicleRevisionResponse,
)

router = APIRouter()


def assignment_display_name(assignment: VehicleAssignment) -> str | None:
    if assignment.employee:
        return f"{assignment.employee.cognome} {assignment.employee.nome}"
    if assignment.user:
        if assignment.user.employee:
            return f"{assignment.user.employee.cognome} {assignment.user.employee.nome}"
        return assignment.user.email
    return None


@router.get("/summary", response_model=FleetSummaryResponse)
async def get_fleet_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    del current_user
    today = date.today()
    next_30_days = today + timedelta(days=30)

    return FleetSummaryResponse(
        total_vehicles=db.query(func.count(Vehicle.id)).scalar() or 0,
        operational_vehicles=db.query(func.count(Vehicle.id)).filter(
            or_(Vehicle.stato == "operativo", Vehicle.stato.is_(None))
        ).scalar() or 0,
        insurance_expiring_30d=db.query(func.count(Vehicle.id)).filter(
            and_(
                Vehicle.scadenza_assicurazione.is_not(None),
                Vehicle.scadenza_assicurazione >= today,
                Vehicle.scadenza_assicurazione <= next_30_days,
            )
        ).scalar() or 0,
        revision_expiring_30d=db.query(func.count(Vehicle.id)).filter(
            and_(
                Vehicle.scadenza_revisione.is_not(None),
                Vehicle.scadenza_revisione >= today,
                Vehicle.scadenza_revisione <= next_30_days,
            )
        ).scalar() or 0,
        active_assignments=db.query(func.count(VehicleAssignment.id)).filter(
            VehicleAssignment.riconsegnato_il.is_(None)
        ).scalar() or 0,
        open_incidents=db.query(func.count(VehicleIncident.id)).filter(
            VehicleIncident.data_chiusura.is_(None)
        ).scalar() or 0,
        tracked_vehicles=db.query(func.count(Vehicle.id)).filter(
            Vehicle.tracker_enabled == True  # noqa: E712
        ).scalar() or 0,
    )


@router.get("/types", response_model=list[dict])
async def list_vehicle_types(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    del current_user
    items = db.query(VehicleType).order_by(VehicleType.name).all()
    return [
        {
            "id": item.id,
            "name": item.name,
            "patente": item.patente,
            "revisione": item.revisione,
            "assicurazione": item.assicurazione,
        }
        for item in items
    ]


@router.get("/vehicles", response_model=FleetVehicleListResponse)
async def list_vehicles(
    search: str | None = Query(default=None),
    stato: str | None = Query(default=None),
    vehicle_type_id: int | None = Query(default=None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    del current_user
    query = db.query(Vehicle).options(
        joinedload(Vehicle.vehicle_type),
        joinedload(Vehicle.assignments).joinedload(VehicleAssignment.user),
        joinedload(Vehicle.assignments).joinedload(VehicleAssignment.employee),
        joinedload(Vehicle.incidents),
    )

    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                Vehicle.targa.ilike(term),
                Vehicle.marca.ilike(term),
                Vehicle.modello.ilike(term),
                Vehicle.tipo.ilike(term),
            )
        )
    if stato:
        query = query.filter(Vehicle.stato == stato)
    if vehicle_type_id:
        query = query.filter(Vehicle.vehicle_type_id == vehicle_type_id)

    total = query.count()
    items = (
        query.order_by(Vehicle.targa.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    payload: list[FleetVehicleListItem] = []
    for item in items:
        active_assignment = next((a for a in item.assignments if a.riconsegnato_il is None), None)
        open_incidents = sum(1 for incident in item.incidents if incident.data_chiusura is None)
        payload.append(
            FleetVehicleListItem(
                id=item.id,
                targa=item.targa,
                marca=item.marca,
                modello=item.modello,
                tipo=item.tipo,
                stato=item.stato,
                km_attuali=item.km_attuali,
                scadenza_assicurazione=item.scadenza_assicurazione,
                scadenza_revisione=item.scadenza_revisione,
                ultima_revisione=item.ultima_revisione,
                localizzazione_corrente=item.localizzazione_corrente,
                vehicle_type_name=item.vehicle_type.name if item.vehicle_type else None,
                current_assignee=assignment_display_name(active_assignment) if active_assignment else None,
                open_incidents=open_incidents,
            )
        )

    return FleetVehicleListResponse(
        items=payload,
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size,
    )


@router.get("/vehicles/{vehicle_id}", response_model=FleetVehicleDetailResponse)
async def get_vehicle_detail(
    vehicle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    del current_user
    vehicle = (
        db.query(Vehicle)
        .options(
            joinedload(Vehicle.vehicle_type),
            joinedload(Vehicle.revisions),
            joinedload(Vehicle.assignments).joinedload(VehicleAssignment.user),
            joinedload(Vehicle.assignments).joinedload(VehicleAssignment.employee),
            joinedload(Vehicle.incidents),
            joinedload(Vehicle.documents),
            joinedload(Vehicle.team_links),
        )
        .filter(Vehicle.id == vehicle_id)
        .first()
    )
    if not vehicle:
        raise HTTPException(status_code=404, detail="Mezzo non trovato")

    return FleetVehicleDetailResponse(
        id=vehicle.id,
        vehicle_type_id=vehicle.vehicle_type_id,
        organization_id=vehicle.organization_id,
        targa=vehicle.targa,
        marca=vehicle.marca,
        modello=vehicle.modello,
        tipo=vehicle.tipo,
        immatricolazione_date=vehicle.immatricolazione_date,
        immatricolazione_mese=vehicle.immatricolazione_mese,
        immatricolazione_anno=vehicle.immatricolazione_anno,
        numero_telaio=vehicle.numero_telaio,
        alimentazione=vehicle.alimentazione,
        euro_classe=vehicle.euro_classe,
        colore=vehicle.colore,
        proprieta_tipo=vehicle.proprieta_tipo,
        localizzazione_corrente=vehicle.localizzazione_corrente,
        assicurazione_compagnia=vehicle.assicurazione_compagnia,
        assicurazione_polizza=vehicle.assicurazione_polizza,
        scadenza_assicurazione=vehicle.scadenza_assicurazione,
        assicurazione_copertura=vehicle.assicurazione_copertura,
        scadenza_revisione=vehicle.scadenza_revisione,
        ultima_revisione=vehicle.ultima_revisione,
        scadenza_verifica_sicurezza=vehicle.scadenza_verifica_sicurezza,
        rottamazione_date=vehicle.rottamazione_date,
        km_attuali=vehicle.km_attuali,
        stato=vehicle.stato,
        tracker_enabled=vehicle.tracker_enabled,
        last_latitude=vehicle.last_latitude,
        last_longitude=vehicle.last_longitude,
        last_position_at=vehicle.last_position_at,
        note=vehicle.note,
        vehicle_type=vehicle.vehicle_type,
        revisions=[FleetVehicleRevisionResponse.model_validate(item) for item in vehicle.revisions],
        assignments=[
            FleetVehicleAssignmentResponse(
                id=item.id,
                vehicle_id=item.vehicle_id,
                user_id=item.user_id,
                employee_id=item.employee_id,
                km_iniziali=item.km_iniziali,
                km_finali=item.km_finali,
                assegnato_il=item.assegnato_il,
                riconsegnato_il=item.riconsegnato_il,
                documento_assegnazione_numero=item.documento_assegnazione_numero,
                documento_assegnazione_data=item.documento_assegnazione_data,
                documento_restituzione_numero=item.documento_restituzione_numero,
                documento_restituzione_data=item.documento_restituzione_data,
                stato=item.stato,
                note=item.note,
                user_display_name=item.user.email if item.user else None,
                employee_display_name=assignment_display_name(item),
            )
            for item in vehicle.assignments
        ],
        incidents=[FleetVehicleIncidentResponse.model_validate(item) for item in vehicle.incidents],
        documents=[FleetVehicleDocumentResponse.model_validate(item) for item in vehicle.documents],
        team_links=vehicle.team_links,
    )


@router.get("/vehicles/{vehicle_id}/history")
async def get_vehicle_history(
    vehicle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    del current_user
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Mezzo non trovato")

    revisions = db.query(VehicleRevision).filter(VehicleRevision.vehicle_id == vehicle_id).count()
    assignments = db.query(VehicleAssignment).filter(VehicleAssignment.vehicle_id == vehicle_id).count()
    incidents = db.query(VehicleIncident).filter(VehicleIncident.vehicle_id == vehicle_id).count()
    documents = db.query(VehicleDocument).filter(VehicleDocument.vehicle_id == vehicle_id).count()

    return {
        "vehicle_id": vehicle_id,
        "revisions": revisions,
        "assignments": assignments,
        "incidents": incidents,
        "documents": documents,
    }
