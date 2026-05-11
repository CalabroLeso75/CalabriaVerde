from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ContractTypeAttachmentResponse(BaseModel):
    id: int
    document_kind: str
    original_name: str
    mime_type: Optional[str] = None
    size_bytes: Optional[int] = None
    note: Optional[str] = None
    created_at: Optional[datetime] = None
    download_url: str

    class Config:
        from_attributes = True


class ContractTypeBase(BaseModel):
    code: str = Field(min_length=2, max_length=50)
    name: str = Field(min_length=2, max_length=150)
    category: str = Field(min_length=2, max_length=50)
    description: Optional[str] = None
    weekly_hours: Optional[int] = Field(default=None, ge=0, le=48)
    supports_integrative: bool = False
    allows_partial_application: bool = False
    is_active: bool = True
    notes: Optional[str] = None


class ContractTypeCreate(ContractTypeBase):
    pass


class ContractTypeUpdate(BaseModel):
    code: Optional[str] = Field(default=None, min_length=2, max_length=50)
    name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    category: Optional[str] = Field(default=None, min_length=2, max_length=50)
    description: Optional[str] = None
    weekly_hours: Optional[int] = Field(default=None, ge=0, le=48)
    supports_integrative: Optional[bool] = None
    allows_partial_application: Optional[bool] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class ContractTypeResponse(ContractTypeBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    attachments: list[ContractTypeAttachmentResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True
