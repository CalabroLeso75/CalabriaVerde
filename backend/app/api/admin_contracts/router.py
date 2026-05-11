from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.contract_type import ContractTypeAttachment, ContractTypeDefinition
from app.models.user import User
from app.schemas.contract_type import (
    ContractTypeCreate,
    ContractTypeResponse,
    ContractTypeUpdate,
)

router = APIRouter()

ALLOWED_ATTACHMENT_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
ALLOWED_ATTACHMENT_KINDS = {"ccnl", "integrativo", "altro"}
STORAGE_ROOT = Path(__file__).resolve().parents[3] / "storage" / "contract_types"
ADMIN_ROLE_CODES = {"superadmin", "admin", "addetto_hr"}


def require_admin_user(current_user: User) -> None:
    if current_user.is_superadmin:
        return

    active_codes = {
        user_role.role.code
        for user_role in current_user.roles
        if user_role.is_active and user_role.role
    }
    if active_codes.intersection(ADMIN_ROLE_CODES):
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Permessi insufficienti per gestire i tipi di contratto",
    )


def serialize_contract_type(contract_type: ContractTypeDefinition) -> ContractTypeResponse:
    data = ContractTypeResponse.model_validate(contract_type)
    data.attachments = [
        attachment_to_response(attachment)
        for attachment in contract_type.attachments
    ]
    return data


def attachment_to_response(attachment: ContractTypeAttachment):
    payload = {
        "id": attachment.id,
        "document_kind": attachment.document_kind,
        "original_name": attachment.original_name,
        "mime_type": attachment.mime_type,
        "size_bytes": attachment.size_bytes,
        "note": attachment.note,
        "created_at": attachment.created_at,
        "download_url": f"/admin/contracts/attachments/{attachment.id}/download",
    }
    from app.schemas.contract_type import ContractTypeAttachmentResponse
    return ContractTypeAttachmentResponse(**payload)


@router.get("/types", response_model=list[ContractTypeResponse])
async def list_contract_types(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin_user(current_user)
    items = db.query(ContractTypeDefinition).order_by(ContractTypeDefinition.name).all()
    return [serialize_contract_type(item) for item in items]


@router.get("/types/{contract_type_id}", response_model=ContractTypeResponse)
async def get_contract_type(
    contract_type_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin_user(current_user)
    contract_type = db.query(ContractTypeDefinition).filter(ContractTypeDefinition.id == contract_type_id).first()
    if not contract_type:
        raise HTTPException(status_code=404, detail="Tipo di contratto non trovato")
    return serialize_contract_type(contract_type)


@router.post("/types", response_model=ContractTypeResponse, status_code=status.HTTP_201_CREATED)
async def create_contract_type(
    payload: ContractTypeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin_user(current_user)
    existing = db.query(ContractTypeDefinition).filter(ContractTypeDefinition.code == payload.code.strip().lower()).first()
    if existing:
        raise HTTPException(status_code=409, detail="Codice contratto già presente")

    item = ContractTypeDefinition(
        code=payload.code.strip().lower(),
        name=payload.name.strip(),
        category=payload.category.strip().lower(),
        description=payload.description,
        weekly_hours=payload.weekly_hours,
        supports_integrative=payload.supports_integrative,
        allows_partial_application=payload.allows_partial_application,
        is_active=payload.is_active,
        notes=payload.notes,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return serialize_contract_type(item)


@router.put("/types/{contract_type_id}", response_model=ContractTypeResponse)
async def update_contract_type(
    contract_type_id: int,
    payload: ContractTypeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin_user(current_user)
    item = db.query(ContractTypeDefinition).filter(ContractTypeDefinition.id == contract_type_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Tipo di contratto non trovato")

    data = payload.model_dump(exclude_unset=True)
    if "code" in data and data["code"]:
        normalized_code = data["code"].strip().lower()
        duplicate = db.query(ContractTypeDefinition).filter(
            ContractTypeDefinition.code == normalized_code,
            ContractTypeDefinition.id != contract_type_id,
        ).first()
        if duplicate:
            raise HTTPException(status_code=409, detail="Codice contratto già presente")
        data["code"] = normalized_code

    for field, value in data.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return serialize_contract_type(item)


@router.post("/types/{contract_type_id}/attachments", response_model=ContractTypeResponse)
async def upload_contract_attachment(
    contract_type_id: int,
    document_kind: str = Form(...),
    note: str | None = Form(default=None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin_user(current_user)
    contract_type = db.query(ContractTypeDefinition).filter(ContractTypeDefinition.id == contract_type_id).first()
    if not contract_type:
        raise HTTPException(status_code=404, detail="Tipo di contratto non trovato")

    normalized_kind = document_kind.strip().lower()
    if normalized_kind not in ALLOWED_ATTACHMENT_KINDS:
        raise HTTPException(status_code=400, detail="Tipo allegato non supportato")
    if file.content_type not in ALLOWED_ATTACHMENT_TYPES:
        raise HTTPException(status_code=400, detail="Formato file non supportato")

    contract_dir = STORAGE_ROOT / str(contract_type_id)
    contract_dir.mkdir(parents=True, exist_ok=True)

    suffix = Path(file.filename or "").suffix.lower() or ".bin"
    stored_name = f"{normalized_kind}_{uuid4().hex}{suffix}"
    stored_path = contract_dir / stored_name
    content = await file.read()
    stored_path.write_bytes(content)

    attachment = ContractTypeAttachment(
        contract_type_id=contract_type_id,
        document_kind=normalized_kind,
        original_name=file.filename or stored_name,
        stored_name=stored_name,
        file_path=str(stored_path),
        mime_type=file.content_type,
        size_bytes=len(content),
        note=note,
        uploaded_by_user_id=current_user.id,
    )
    db.add(attachment)
    db.commit()
    db.refresh(contract_type)
    return serialize_contract_type(contract_type)


@router.delete("/attachments/{attachment_id}", response_model=ContractTypeResponse)
async def delete_contract_attachment(
    attachment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin_user(current_user)
    attachment = db.query(ContractTypeAttachment).filter(ContractTypeAttachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Allegato non trovato")

    contract_type = attachment.contract_type
    stored_path = Path(attachment.file_path)
    if stored_path.exists():
        stored_path.unlink()

    db.delete(attachment)
    db.commit()
    db.refresh(contract_type)
    return serialize_contract_type(contract_type)


@router.get("/attachments/{attachment_id}/download")
async def download_contract_attachment(
    attachment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin_user(current_user)
    attachment = db.query(ContractTypeAttachment).filter(ContractTypeAttachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Allegato non trovato")

    path = Path(attachment.file_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="File allegato non disponibile")

    return FileResponse(path, media_type=attachment.mime_type, filename=attachment.original_name)
