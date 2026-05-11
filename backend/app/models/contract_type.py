from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base
from app.models.user import User  # noqa: F401


class ContractTypeDefinition(Base):
    __tablename__ = "contract_type_definitions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    weekly_hours = Column(Integer, nullable=True)
    supports_integrative = Column(Boolean, nullable=False, default=False)
    allows_partial_application = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    attachments = relationship(
        "ContractTypeAttachment",
        back_populates="contract_type",
        cascade="all, delete-orphan",
        order_by="ContractTypeAttachment.created_at.desc()",
    )


class ContractTypeAttachment(Base):
    __tablename__ = "contract_type_attachments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    contract_type_id = Column(Integer, ForeignKey("contract_type_definitions.id", ondelete="CASCADE"), nullable=False, index=True)
    document_kind = Column(String(30), nullable=False)
    original_name = Column(String(255), nullable=False)
    stored_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    mime_type = Column(String(100), nullable=True)
    size_bytes = Column(Integer, nullable=True)
    note = Column(Text, nullable=True)
    uploaded_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    contract_type = relationship("ContractTypeDefinition", back_populates="attachments")
