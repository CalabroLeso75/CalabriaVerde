from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models.communications import CommunicationLog, CommunicationRecipient, CommunicationTarget


def resolve_targets(
    db: Session,
    *,
    module_scope: str,
    province_code: str | None = None,
) -> list[CommunicationTarget]:
    query = db.query(CommunicationTarget).filter(
        CommunicationTarget.is_active == True,  # noqa: E712
        CommunicationTarget.module_scope.in_([module_scope, "global"]),
    )

    targets = query.order_by(CommunicationTarget.role_label.asc(), CommunicationTarget.display_name.asc()).all()
    if not province_code:
        return targets

    return [
        target for target in targets
        if target.province_code in (None, "", province_code)
    ]


def register_communication(
    db: Session,
    *,
    module_scope: str,
    compartment_scope: str | None,
    event_type: str,
    channel: str,
    subject: str,
    message: str,
    related_table: str | None = None,
    related_id: int | None = None,
    sender_user_id: int | None = None,
    sender_employee_id: int | None = None,
    metadata_json: dict[str, Any] | None = None,
    targets: list[CommunicationTarget] | None = None,
) -> CommunicationLog:
    log = CommunicationLog(
        module_scope=module_scope,
        compartment_scope=compartment_scope,
        event_type=event_type,
        channel=channel,
        subject=subject,
        message=message,
        related_table=related_table,
        related_id=related_id,
        sender_user_id=sender_user_id,
        sender_employee_id=sender_employee_id,
        metadata_json=metadata_json or {},
        status="registrata" if targets else "senza_destinatari",
    )
    db.add(log)
    db.flush()

    for target in targets or []:
        preferred_channels = target.preferred_channels or []
        delivery_channel = preferred_channels[0] if preferred_channels else channel
        destination = (
            target.email
            if delivery_channel == "email"
            else target.whatsapp
            if delivery_channel == "whatsapp"
            else target.phone
            if delivery_channel == "sms"
            else target.display_name
        )
        db.add(
            CommunicationRecipient(
                communication_log_id=log.id,
                target_id=target.id,
                recipient_user_id=target.user_id,
                recipient_label=target.display_name,
                channel=delivery_channel,
                destination=destination,
                delivery_status="registrata",
            )
        )

    db.flush()
    return log
