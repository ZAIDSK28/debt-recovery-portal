# core/utils.py

from __future__ import annotations

import uuid
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


def build_request_log_context(request) -> dict[str, Any]:
    request_id = None
    if request is not None:
        request_id = request.headers.get("X-Request-ID") or request.META.get("HTTP_X_REQUEST_ID")

    if not request_id:
        request_id = str(uuid.uuid4())

    return {
        "request_id": request_id,
        "path": getattr(request, "path", None),
        "method": getattr(request, "method", None),
        "user_id": getattr(getattr(request, "user", None), "id", None),
    }