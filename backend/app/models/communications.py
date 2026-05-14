"""
Registro comunicazioni e destinatari configurabili.

La struttura è pensata per essere riusata da più moduli del gestionale,
partendo dal Parco Macchine ma senza vincolarsi a esso.
"""

from sqlalchemy import (
    JSON,
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


class CommunicationTarget(Base):
    __tablename__ = "communication_targets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    module_scope = Column(String(50), nullable=False, index=True, default="global")
    compartment_scope = Column(String(100), nullable=True)
    role_label = Column(String(100), nullable=False)
    province_code = Column(String(10), nullable=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    display_name = Column(String(150), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    whatsapp = Column(String(50), nullable=True)
    preferred_channels = Column(JSON, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    note = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)

    organization = relationship("Organization")
    user = relationship("User")
    receipts = relationship("CommunicationRecipient", back_populates="target")


class CommunicationLog(Base):
    __tablename__ = "communication_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    module_scope = Column(String(50), nullable=False, index=True, default="global")
    compartment_scope = Column(String(100), nullable=True)
    event_type = Column(String(100), nullable=False, index=True)
    channel = Column(String(50), nullable=False, default="sistema")
    subject = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    related_table = Column(String(100), nullable=True)
    related_id = Column(Integer, nullable=True, index=True)

    sender_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    sender_employee_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    metadata_json = Column(JSON, nullable=True)
    status = Column(String(50), nullable=False, default="registrata")

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)

    sender_user = relationship("User", foreign_keys=[sender_user_id])
    sender_employee = relationship("Employee", foreign_keys=[sender_employee_id])
    recipients = relationship(
        "CommunicationRecipient",
        back_populates="communication_log",
        cascade="all, delete-orphan",
        order_by="CommunicationRecipient.id.asc()",
    )


class CommunicationRecipient(Base):
    __tablename__ = "communication_recipients"

    id = Column(Integer, primary_key=True, autoincrement=True)
    communication_log_id = Column(Integer, ForeignKey("communication_logs.id", ondelete="CASCADE"), nullable=False, index=True)
    target_id = Column(Integer, ForeignKey("communication_targets.id", ondelete="SET NULL"), nullable=True, index=True)
    recipient_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    recipient_employee_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)

    recipient_label = Column(String(150), nullable=False)
    channel = Column(String(50), nullable=False, default="sistema")
    destination = Column(String(255), nullable=True)
    delivery_status = Column(String(50), nullable=False, default="pending")
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)

    communication_log = relationship("CommunicationLog", back_populates="recipients")
    target = relationship("CommunicationTarget", back_populates="receipts")
    recipient_user = relationship("User", foreign_keys=[recipient_user_id])
    recipient_employee = relationship("Employee", foreign_keys=[recipient_employee_id])
