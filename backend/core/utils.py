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
    request=None,                  # <-- new parameter
) -> None:
    # If ip_address not given but request is, try to use request.client_ip
    if ip_address is None and request is not None:
        ip_address = getattr(request, 'client_ip', None)
        # fallback in case middleware didn't run (should not happen)
        if ip_address is None:
            ip_address = get_client_ip(request)

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