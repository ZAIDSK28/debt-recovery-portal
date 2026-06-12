# core/utils.py

from __future__ import annotations

import uuid
from datetime import date
from typing import Any

from core.models import AuditLog


def calculate_overdue_days(invoice_date: date) -> int:
    delta = date.today() - invoice_date
    return max(delta.days, 0)


def get_client_ip(request) -> str | None:
    """
    Extract the real client IP address from the request.
    Respects the X-Forwarded-For header set by reverse proxies (nginx, etc.).
    Returns None when the request object is unavailable.
    """
    if request is None:
        return None
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        # The leftmost address is the original client; subsequent entries are proxies
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR") or None


def create_audit_log(
    *,
    actor,
    action: str,
    entity_type: str,
    entity_id: str,
    metadata: dict[str, Any] | None = None,
    ip_address: str | None = None,
) -> None:
    """
    Persist an audit log entry.

    Args:
        actor: The User instance performing the action (may be None for
               system-generated events).
        action: Dot-separated action identifier, e.g. "stock.transfer.created".
        entity_type: Model name of the affected entity, e.g. "StockTransfer".
        entity_id: String representation of the entity's primary key.
        metadata: Arbitrary JSON-serialisable context for the event.
        ip_address: Client IP — obtain via get_client_ip(request).
    """
    actor_username = ""
    if actor is not None:
        actor_username = getattr(actor, "username", "") or ""

    AuditLog.objects.create(
        actor=actor,
        actor_username=actor_username,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        metadata=metadata or {},
        ip_address=ip_address,
    )


def build_request_log_context(request) -> dict[str, Any]:
    request_id = None
    if request is not None:
        request_id = (
            getattr(request, "request_id", None)
            or request.headers.get("X-Request-ID")
            or request.META.get("HTTP_X_REQUEST_ID")
        )

    if not request_id:
        request_id = str(uuid.uuid4())

    return {
        "request_id": request_id,
        "path": getattr(request, "path", None),
        "method": getattr(request, "method", None),
        "user_id": getattr(getattr(request, "user", None), "id", None),
    }