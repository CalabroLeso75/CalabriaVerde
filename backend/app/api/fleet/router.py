from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.communications import CommunicationLog, CommunicationTarget
from app.models.employee import Employee
from app.models.fleet import (
    AibTeamVehicle,
    FleetGroup,
    FleetGroupMember,
    Vehicle,
    VehicleAlert,
    VehicleAssignment,
    VehicleDocument,
    VehicleIncident,
    VehicleInsuranceRecord,
    VehicleRevision,
    VehicleType,
    VehicleUsageLog,
)
from app.models.user import User
from app.schemas.fleet import (
    CommunicationLogResponse,
    CommunicationRecipientResponse,
    CommunicationTargetCreate,
    CommunicationTargetResponse,
    FleetBulkInsuranceUpdate,
    FleetBulkRevisionUpdate,
    FleetGroupCreate,
    FleetGroupResponse,
    FleetSummaryResponse,
    FleetVehicleAlertCreate,
    FleetVehicleAlertResponse,
    FleetVehicleAssignmentCreate,
    FleetVehicleAssignmentReturn,
    FleetVehicleAssignmentResponse,
    FleetVehicleDetailResponse,
    FleetVehicleDocumentResponse,
    FleetVehicleIncidentResponse,
    FleetVehicleInsuranceCreate,
    FleetVehicleInsuranceRecordResponse,
    FleetVehicleListItem,
    FleetVehicleListResponse,
    FleetVehicleRevisionCreate,
    FleetVehicleRevisionResponse,
    FleetVehicleUsageCreate,
    FleetVehicleUsageLogResponse,
)
from app.services.communication_log import register_communication, resolve_targets

router = APIRouter()


def assignment_display_name(assignment: VehicleAssignment) -> str | None:
    if assignment.employee:
        return f"{assignment.employee.cognome} {assignment.employee.nome}"
    if assignment.user:
        if getattr(assignment.user, "employee", None):
            return f"{assignment.user.employee.cognome} {assignment.user.employee.nome}"
        return assignment.user.email
    return None


def actor_display_name(user: User | None = None, employee: Employee | None = None) -> str | None:
    if employee:
        return f"{employee.cognome} {employee.nome}"
    if user:
        return f"{user.cognome} {user.nome}"
    return None


def serialize_group(group: FleetGroup) -> FleetGroupResponse:
    return FleetGroupResponse(
        id=group.id,
        name=group.name,
        code=group.code,
        description=group.description,
        scope=group.scope,
        organization_id=group.organization_id,
        province_code=group.province_code,
        is_active=group.is_active,
        vehicle_count=len(group.members),
    )


def serialize_usage_log(item: VehicleUsageLog) -> FleetVehicleUsageLogResponse:
    return FleetVehicleUsageLogResponse(
        id=item.id,
        vehicle_id=item.vehicle_id,
        assignment_id=item.assignment_id,
        user_id=item.user_id,
        employee_id=item.employee_id,
        started_at=item.started_at,
        ended_at=item.ended_at,
        km_partenza=item.km_partenza,
        km_rientro=item.km_rientro,
        note_presa=item.note_presa,
        note_rientro=item.note_rientro,
        issue_flags=item.issue_flags or [],
        actor_display_name=actor_display_name(item.user, item.employee),
    )


def serialize_alert(item: VehicleAlert) -> FleetVehicleAlertResponse:
    return FleetVehicleAlertResponse(
        id=item.id,
        vehicle_id=item.vehicle_id,
        assignment_id=item.assignment_id,
        user_id=item.user_id,
        employee_id=item.employee_id,
        alert_type=item.alert_type,
        severity=item.severity,
        status=item.status,
        title=item.title,
        description=item.description,
        location_text=item.location_text,
        latitude=item.latitude,
        longitude=item.longitude,
        province_code=item.province_code,
        event_at=item.event_at,
        resolved_at=item.resolved_at,
        actor_display_name=actor_display_name(item.user, item.employee),
    )


def serialize_communication(item: CommunicationLog) -> CommunicationLogResponse:
    return CommunicationLogResponse(
        id=item.id,
        module_scope=item.module_scope,
        compartment_scope=item.compartment_scope,
        event_type=item.event_type,
        channel=item.channel,
        subject=item.subject,
        message=item.message,
        related_table=item.related_table,
        related_id=item.related_id,
        status=item.status,
        created_at=item.created_at,
        recipients=[
            CommunicationRecipientResponse(
                id=recipient.id,
                recipient_label=recipient.recipient_label,
                channel=recipient.channel,
                destination=recipient.destination,
                delivery_status=recipient.delivery_status,
            )
            for recipient in item.recipients
        ],
    )


def load_vehicle_or_404(db: Session, vehicle_id: int) -> Vehicle:
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Mezzo non trovato")
    return vehicle


def load_group_or_404(db: Session, group_id: int) -> FleetGroup:
    group = (
        db.query(FleetGroup)
        .options(joinedload(FleetGroup.members))
        .filter(FleetGroup.id == group_id)
        .first()
    )
    if not group:
        raise HTTPException(status_code=404, detail="Gruppo mezzi non trovato")
    return group


def current_user_employee_id(db: Session, current_user: User) -> int | None:
    employee = db.query(Employee.id).filter(Employee.user_id == current_user.id).first()
    return employee.id if employee else None


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


@router.get("/groups", response_model=list[FleetGroupResponse])
async def list_fleet_groups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    del current_user
    groups = (
        db.query(FleetGroup)
        .options(joinedload(FleetGroup.members))
        .order_by(FleetGroup.name.asc())
        .all()
    )
    return [serialize_group(group) for group in groups]


@router.post("/groups", response_model=FleetGroupResponse, status_code=status.HTTP_201_CREATED)
async def create_fleet_group(
    data: FleetGroupCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    del current_user
    code = data.code.strip().upper()
    if db.query(FleetGroup).filter(or_(FleetGroup.code == code, FleetGroup.name == data.name.strip())).first():
        raise HTTPException(status_code=409, detail="Gruppo già presente")

    group = FleetGroup(
        name=data.name.strip(),
        code=code,
        description=data.description,
        scope=data.scope,
        organization_id=data.organization_id,
        province_code=data.province_code.upper() if data.province_code else None,
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    return serialize_group(group)


@router.post("/groups/{group_id}/vehicles/{vehicle_id}", status_code=status.HTTP_201_CREATED)
async def add_vehicle_to_group(
    group_id: int,
    vehicle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    del current_user
    load_vehicle_or_404(db, vehicle_id)
    load_group_or_404(db, group_id)

    existing = db.query(FleetGroupMember).filter(
        FleetGroupMember.group_id == group_id,
        FleetGroupMember.vehicle_id == vehicle_id,
    ).first()
    if existing:
        return {"status": "already_linked"}

    db.add(FleetGroupMember(group_id=group_id, vehicle_id=vehicle_id))
    db.commit()
    return {"status": "linked"}


@router.delete("/groups/{group_id}/vehicles/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_vehicle_from_group(
    group_id: int,
    vehicle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    del current_user
    membership = db.query(FleetGroupMember).filter(
        FleetGroupMember.group_id == group_id,
        FleetGroupMember.vehicle_id == vehicle_id,
    ).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Appartenenza al gruppo non trovata")
    db.delete(membership)
    db.commit()
    return None


@router.get("/communication-targets", response_model=list[CommunicationTargetResponse])
async def list_communication_targets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    del current_user
    items = db.query(CommunicationTarget).order_by(
        CommunicationTarget.role_label.asc(),
        CommunicationTarget.display_name.asc(),
    ).all()
    return [
        CommunicationTargetResponse(
            id=item.id,
            module_scope=item.module_scope,
            compartment_scope=item.compartment_scope,
            role_label=item.role_label,
            province_code=item.province_code,
            organization_id=item.organization_id,
            user_id=item.user_id,
            display_name=item.display_name,
            email=item.email,
            phone=item.phone,
            whatsapp=item.whatsapp,
            preferred_channels=item.preferred_channels or [],
            is_active=item.is_active,
            note=item.note,
        )
        for item in items
    ]


@router.post("/communication-targets", response_model=CommunicationTargetResponse, status_code=status.HTTP_201_CREATED)
async def create_communication_target(
    data: CommunicationTargetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    del current_user
    item = CommunicationTarget(
        module_scope=data.module_scope,
        compartment_scope=data.compartment_scope,
        role_label=data.role_label,
        province_code=data.province_code.upper() if data.province_code else None,
        organization_id=data.organization_id,
        user_id=data.user_id,
        display_name=data.display_name,
        email=data.email,
        phone=data.phone,
        whatsapp=data.whatsapp,
        preferred_channels=data.preferred_channels,
        is_active=data.is_active,
        note=data.note,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return CommunicationTargetResponse(
        id=item.id,
        module_scope=item.module_scope,
        compartment_scope=item.compartment_scope,
        role_label=item.role_label,
        province_code=item.province_code,
        organization_id=item.organization_id,
        user_id=item.user_id,
        display_name=item.display_name,
        email=item.email,
        phone=item.phone,
        whatsapp=item.whatsapp,
        preferred_channels=item.preferred_channels or [],
        is_active=item.is_active,
        note=item.note,
    )


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


@router.post("/vehicles/{vehicle_id}/insurance", response_model=FleetVehicleInsuranceRecordResponse, status_code=status.HTTP_201_CREATED)
async def add_vehicle_insurance(
    vehicle_id: int,
    data: FleetVehicleInsuranceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    vehicle = load_vehicle_or_404(db, vehicle_id)
    db.query(VehicleInsuranceRecord).filter(
        VehicleInsuranceRecord.vehicle_id == vehicle_id,
        VehicleInsuranceRecord.is_current == True,  # noqa: E712
    ).update({"is_current": False}, synchronize_session=False)

    record = VehicleInsuranceRecord(
        vehicle_id=vehicle_id,
        source_type=data.source_type,
        compagnia=data.compagnia,
        broker=data.broker,
        package_name=data.package_name,
        numero_polizza=data.numero_polizza,
        copertura_dal=data.copertura_dal,
        copertura_al=data.copertura_al,
        data_scadenza=data.data_scadenza,
        channels_ready=data.channels_ready,
        note=data.note,
        created_by_user_id=current_user.id,
        is_current=True,
    )
    db.add(record)

    vehicle.assicurazione_compagnia = data.compagnia
    vehicle.assicurazione_polizza = data.numero_polizza
    vehicle.assicurazione_copertura = data.copertura_al
    vehicle.scadenza_assicurazione = data.data_scadenza

    db.commit()
    db.refresh(record)
    return FleetVehicleInsuranceRecordResponse.model_validate(record)


@router.post("/bulk/insurance")
async def bulk_update_insurance(
    data: FleetBulkInsuranceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = load_group_or_404(db, data.group_id)
    vehicle_ids = [member.vehicle_id for member in group.members]
    if not vehicle_ids:
        raise HTTPException(status_code=400, detail="Il gruppo selezionato non contiene mezzi")

    updated = 0
    for vehicle in db.query(Vehicle).filter(Vehicle.id.in_(vehicle_ids)).all():
        db.query(VehicleInsuranceRecord).filter(
            VehicleInsuranceRecord.vehicle_id == vehicle.id,
            VehicleInsuranceRecord.is_current == True,  # noqa: E712
        ).update({"is_current": False}, synchronize_session=False)

        db.add(VehicleInsuranceRecord(
            vehicle_id=vehicle.id,
            group_id=group.id,
            source_type=data.source_type,
            compagnia=data.compagnia,
            broker=data.broker,
            package_name=data.package_name,
            copertura_dal=data.copertura_dal,
            copertura_al=data.copertura_al,
            data_scadenza=data.data_scadenza,
            note=data.note,
            created_by_user_id=current_user.id,
            is_current=True,
        ))
        vehicle.assicurazione_compagnia = data.compagnia
        vehicle.assicurazione_copertura = data.copertura_al
        vehicle.scadenza_assicurazione = data.data_scadenza
        updated += 1

    db.commit()
    return {"updated_vehicles": updated, "group": group.name}


@router.post("/vehicles/{vehicle_id}/revision", response_model=FleetVehicleRevisionResponse, status_code=status.HTTP_201_CREATED)
async def add_vehicle_revision(
    vehicle_id: int,
    data: FleetVehicleRevisionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    del current_user
    vehicle = load_vehicle_or_404(db, vehicle_id)
    revision = VehicleRevision(
        vehicle_id=vehicle_id,
        data_revisione=data.data_revisione,
        esito=data.esito,
        km_rilevati=data.km_rilevati,
        note=data.note,
    )
    db.add(revision)
    vehicle.ultima_revisione = data.data_revisione
    if data.scadenza_revisione:
        vehicle.scadenza_revisione = data.scadenza_revisione
    if data.scadenza_verifica_sicurezza:
        vehicle.scadenza_verifica_sicurezza = data.scadenza_verifica_sicurezza
    if data.km_rilevati and data.km_rilevati > vehicle.km_attuali:
        vehicle.km_attuali = data.km_rilevati
    db.commit()
    db.refresh(revision)
    return FleetVehicleRevisionResponse.model_validate(revision)


@router.post("/bulk/revision")
async def bulk_update_revision(
    data: FleetBulkRevisionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    del current_user
    group = load_group_or_404(db, data.group_id)
    vehicle_ids = [member.vehicle_id for member in group.members]
    if not vehicle_ids:
        raise HTTPException(status_code=400, detail="Il gruppo selezionato non contiene mezzi")

    updated = 0
    vehicles = db.query(Vehicle).filter(Vehicle.id.in_(vehicle_ids)).all()
    for vehicle in vehicles:
        vehicle.scadenza_revisione = data.scadenza_revisione
        vehicle.scadenza_verifica_sicurezza = data.scadenza_verifica_sicurezza
        if data.data_revisione:
            db.add(VehicleRevision(
                vehicle_id=vehicle.id,
                data_revisione=data.data_revisione,
                esito=data.esito,
                km_rilevati=vehicle.km_attuali,
                note=data.note,
            ))
            vehicle.ultima_revisione = data.data_revisione
        updated += 1

    db.commit()
    return {"updated_vehicles": updated, "group": group.name}


@router.post("/vehicles/{vehicle_id}/assignments", response_model=FleetVehicleAssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_vehicle_assignment(
    vehicle_id: int,
    data: FleetVehicleAssignmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    vehicle = load_vehicle_or_404(db, vehicle_id)
    employee_id = data.employee_id or current_user_employee_id(db, current_user)
    assignment = VehicleAssignment(
        vehicle_id=vehicle_id,
        user_id=data.user_id or current_user.id,
        employee_id=employee_id,
        km_iniziali=data.km_iniziali,
        assegnato_il=data.assegnato_il or datetime.now(timezone.utc),
        riconsegnato_il=data.riconsegnato_il,
        documento_assegnazione_numero=data.documento_assegnazione_numero,
        documento_assegnazione_data=data.documento_assegnazione_data,
        documento_restituzione_numero=data.documento_restituzione_numero,
        documento_restituzione_data=data.documento_restituzione_data,
        stato=data.stato,
        note=data.note,
    )
    db.add(assignment)
    if data.km_iniziali > vehicle.km_attuali:
        vehicle.km_attuali = data.km_iniziali
    db.commit()
    db.refresh(assignment)
    return FleetVehicleAssignmentResponse(
        id=assignment.id,
        vehicle_id=assignment.vehicle_id,
        user_id=assignment.user_id,
        employee_id=assignment.employee_id,
        km_iniziali=assignment.km_iniziali,
        km_finali=assignment.km_finali,
        assegnato_il=assignment.assegnato_il,
        riconsegnato_il=assignment.riconsegnato_il,
        documento_assegnazione_numero=assignment.documento_assegnazione_numero,
        documento_assegnazione_data=assignment.documento_assegnazione_data,
        documento_restituzione_numero=assignment.documento_restituzione_numero,
        documento_restituzione_data=assignment.documento_restituzione_data,
        stato=assignment.stato,
        note=assignment.note,
        user_display_name=actor_display_name(current_user, None),
        employee_display_name=actor_display_name(None, db.query(Employee).filter(Employee.id == assignment.employee_id).first() if assignment.employee_id else None),
    )


@router.patch("/assignments/{assignment_id}/return", response_model=FleetVehicleAssignmentResponse)
async def return_vehicle_assignment(
    assignment_id: int,
    data: FleetVehicleAssignmentReturn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assignment = (
        db.query(VehicleAssignment)
        .options(joinedload(VehicleAssignment.user), joinedload(VehicleAssignment.employee))
        .filter(VehicleAssignment.id == assignment_id)
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=404, detail="Assegnazione mezzo non trovata")

    vehicle = load_vehicle_or_404(db, assignment.vehicle_id)
    if data.km_finali < assignment.km_iniziali:
        raise HTTPException(status_code=400, detail="I km finali non possono essere inferiori ai km iniziali")

    assignment.km_finali = data.km_finali
    assignment.riconsegnato_il = data.riconsegnato_il or datetime.now(timezone.utc)
    assignment.documento_restituzione_numero = data.documento_restituzione_numero
    assignment.documento_restituzione_data = data.documento_restituzione_data
    assignment.stato = data.stato
    assignment.note = "\n".join([part for part in [assignment.note, data.note] if part]).strip() or assignment.note

    if data.km_finali > vehicle.km_attuali:
        vehicle.km_attuali = data.km_finali

    db.commit()
    db.refresh(assignment)
    employee = assignment.employee or (db.query(Employee).filter(Employee.id == assignment.employee_id).first() if assignment.employee_id else None)
    return FleetVehicleAssignmentResponse(
        id=assignment.id,
        vehicle_id=assignment.vehicle_id,
        user_id=assignment.user_id,
        employee_id=assignment.employee_id,
        km_iniziali=assignment.km_iniziali,
        km_finali=assignment.km_finali,
        assegnato_il=assignment.assegnato_il,
        riconsegnato_il=assignment.riconsegnato_il,
        documento_assegnazione_numero=assignment.documento_assegnazione_numero,
        documento_assegnazione_data=assignment.documento_assegnazione_data,
        documento_restituzione_numero=assignment.documento_restituzione_numero,
        documento_restituzione_data=assignment.documento_restituzione_data,
        stato=assignment.stato,
        note=assignment.note,
        user_display_name=actor_display_name(assignment.user or current_user, None),
        employee_display_name=actor_display_name(None, employee),
    )


@router.post("/assignments/{assignment_id}/usage", response_model=FleetVehicleUsageLogResponse, status_code=status.HTTP_201_CREATED)
async def add_vehicle_usage_log(
    assignment_id: int,
    data: FleetVehicleUsageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assignment = db.query(VehicleAssignment).filter(VehicleAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assegnazione mezzo non trovata")

    vehicle = load_vehicle_or_404(db, assignment.vehicle_id)
    if data.km_rientro is not None and data.km_rientro < data.km_partenza:
        raise HTTPException(status_code=400, detail="I km di rientro non possono essere inferiori ai km di partenza")

    item = VehicleUsageLog(
        vehicle_id=assignment.vehicle_id,
        assignment_id=assignment.id,
        user_id=data.user_id or assignment.user_id or current_user.id,
        employee_id=data.employee_id or assignment.employee_id or current_user_employee_id(db, current_user),
        started_at=data.started_at or datetime.now(timezone.utc),
        ended_at=data.ended_at,
        km_partenza=data.km_partenza,
        km_rientro=data.km_rientro,
        note_presa=data.note_presa,
        note_rientro=data.note_rientro,
        issue_flags=data.issue_flags,
    )
    db.add(item)

    if data.km_partenza > vehicle.km_attuali:
        vehicle.km_attuali = data.km_partenza
    if data.km_rientro is not None and data.km_rientro > vehicle.km_attuali:
        vehicle.km_attuali = data.km_rientro
        assignment.km_finali = data.km_rientro
    db.commit()
    db.refresh(item)
    return serialize_usage_log(item)


@router.post("/vehicles/{vehicle_id}/alerts", response_model=FleetVehicleAlertResponse, status_code=status.HTTP_201_CREATED)
async def create_vehicle_alert(
    vehicle_id: int,
    data: FleetVehicleAlertCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    vehicle = load_vehicle_or_404(db, vehicle_id)

    alert = VehicleAlert(
        vehicle_id=vehicle_id,
        assignment_id=data.assignment_id,
        user_id=data.user_id or current_user.id,
        employee_id=data.employee_id or current_user_employee_id(db, current_user),
        alert_type=data.alert_type,
        severity=data.severity,
        status="aperto",
        title=data.title,
        description=data.description,
        location_text=data.location_text,
        latitude=data.latitude,
        longitude=data.longitude,
        province_code=(data.province_code or "").upper() or None,
        event_at=data.event_at or datetime.now(timezone.utc),
    )
    db.add(alert)
    db.flush()

    if data.alert_type.lower() == "sinistro":
        db.add(VehicleIncident(
            vehicle_id=vehicle_id,
            data_evento=(data.event_at or datetime.now(timezone.utc)).date(),
            stato="aperto",
            tipo="sinistro operativo",
            luogo=data.location_text,
            descrizione=data.description,
            note=f"Generato da alert operativo #{alert.id}",
        ))

    province_scope = alert.province_code or vehicle.localizzazione_corrente
    targets = resolve_targets(db, module_scope="fleet", province_code=province_scope if isinstance(province_scope, str) and len(province_scope) <= 10 else None)
    register_communication(
        db,
        module_scope="fleet",
        compartment_scope="parco_macchine",
        event_type=f"alert_{alert.alert_type}",
        channel="sistema",
        subject=f"{alert.alert_type.upper()} mezzo {vehicle.targa}",
        message=alert.description,
        related_table="vehicles",
        related_id=vehicle.id,
        sender_user_id=alert.user_id,
        sender_employee_id=alert.employee_id,
        metadata_json={
            "alert_id": alert.id,
            "vehicle_id": vehicle.id,
            "vehicle_targa": vehicle.targa,
            "severity": alert.severity,
            "province_code": alert.province_code,
            "location_text": alert.location_text,
        },
        targets=targets,
    )

    db.commit()
    db.refresh(alert)
    return serialize_alert(alert)


@router.get("/vehicles/{vehicle_id}/communications", response_model=list[CommunicationLogResponse])
async def list_vehicle_communications(
    vehicle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    del current_user
    load_vehicle_or_404(db, vehicle_id)
    items = (
        db.query(CommunicationLog)
        .options(joinedload(CommunicationLog.recipients))
        .filter(
            CommunicationLog.related_table == "vehicles",
            CommunicationLog.related_id == vehicle_id,
        )
        .order_by(CommunicationLog.created_at.desc())
        .all()
    )
    return [serialize_communication(item) for item in items]


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
            joinedload(Vehicle.groups).joinedload(FleetGroupMember.group),
            joinedload(Vehicle.insurance_records),
            joinedload(Vehicle.revisions),
            joinedload(Vehicle.assignments).joinedload(VehicleAssignment.user),
            joinedload(Vehicle.assignments).joinedload(VehicleAssignment.employee),
            joinedload(Vehicle.usage_logs).joinedload(VehicleUsageLog.user),
            joinedload(Vehicle.usage_logs).joinedload(VehicleUsageLog.employee),
            joinedload(Vehicle.alerts).joinedload(VehicleAlert.user),
            joinedload(Vehicle.alerts).joinedload(VehicleAlert.employee),
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
        groups=[serialize_group(item.group) for item in vehicle.groups if item.group],
        insurance_records=[FleetVehicleInsuranceRecordResponse.model_validate(item) for item in vehicle.insurance_records],
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
        usage_logs=[serialize_usage_log(item) for item in vehicle.usage_logs],
        alerts=[serialize_alert(item) for item in vehicle.alerts],
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
    usage_logs = db.query(VehicleUsageLog).filter(VehicleUsageLog.vehicle_id == vehicle_id).count()
    incidents = db.query(VehicleIncident).filter(VehicleIncident.vehicle_id == vehicle_id).count()
    alerts = db.query(VehicleAlert).filter(VehicleAlert.vehicle_id == vehicle_id).count()
    documents = db.query(VehicleDocument).filter(VehicleDocument.vehicle_id == vehicle_id).count()
    communications = db.query(CommunicationLog).filter(
        CommunicationLog.related_table == "vehicles",
        CommunicationLog.related_id == vehicle_id,
    ).count()

    return {
        "vehicle_id": vehicle_id,
        "revisions": revisions,
        "assignments": assignments,
        "usage_logs": usage_logs,
        "incidents": incidents,
        "alerts": alerts,
        "documents": documents,
        "communications": communications,
    }
