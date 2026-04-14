from __future__ import annotations

from datetime import date
from typing import Any

from core.models import AuditLog


def calculate_overdue_days(invoice_date: date) -> int:
    delta = date.today() - invoice_date
    return max(delta.days, 0)


def create_audit_log(*, actor, action: str, entity_type: str, entity_id: str, metadata: dict[str, Any] | None = None) -> None:
    AuditLog.objects.create(
        actor=actor,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        metadata=metadata or {},
    )