# core/exceptions.py

import logging

from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.http import Http404
from rest_framework import status
from rest_framework.exceptions import (
    AuthenticationFailed,
    NotAuthenticated,
    PermissionDenied,
    ValidationError,
)
from rest_framework.response import Response
from rest_framework.views import exception_handler


logger = logging.getLogger(__name__)


def _get_request_meta(request):
    if not request:
        return {}

    request_id = (
        getattr(request, "request_id", None)
        or request.headers.get("X-Request-ID")
        or request.META.get("HTTP_X_REQUEST_ID")
    )

    return {
        "request_id": request_id,
        "path": getattr(request, "path", None),
        "method": getattr(request, "method", None),
    }


def _log_exception(level, message, *, exc=None, context=None):
    request = (context or {}).get("request")
    view = (context or {}).get("view")
    extra = _get_request_meta(request)
    extra["view"] = view.__class__.__name__ if view else None

    if level == "warning":
        logger.warning(message, extra=extra, exc_info=exc)
    else:
        logger.exception(message, extra=extra, exc_info=exc)


def _with_request_id(response, context):
    request = (context or {}).get("request")
    request_id = getattr(request, "request_id", None) if request else None
    if request_id and response is not None:
        response["X-Request-ID"] = request_id
    return response


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        _log_exception("warning", "Handled API exception", exc=exc, context=context)
        return _with_request_id(response, context)

    if isinstance(exc, ValidationError):
        _log_exception("warning", "Validation error", exc=exc, context=context)
        detail = getattr(exc, "detail", {"detail": "Invalid input."})
        return _with_request_id(Response(detail, status=status.HTTP_400_BAD_REQUEST), context)

    if isinstance(exc, (AuthenticationFailed, NotAuthenticated)):
        _log_exception("warning", "Authentication error", exc=exc, context=context)
        detail = getattr(exc, "detail", "Authentication failed.")
        return _with_request_id(Response({"detail": detail}, status=status.HTTP_401_UNAUTHORIZED), context)

    if isinstance(exc, (PermissionDenied, DjangoPermissionDenied)):
        _log_exception("warning", "Permission denied", exc=exc, context=context)
        detail = getattr(exc, "detail", "You do not have permission to perform this action.")
        return _with_request_id(Response({"detail": detail}, status=status.HTTP_403_FORBIDDEN), context)

    if isinstance(exc, Http404):
        _log_exception("warning", "Resource not found", exc=exc, context=context)
        return _with_request_id(Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND), context)

    _log_exception("exception", "Unhandled API exception", exc=exc, context=context)
    return _with_request_id(
        Response(
            {"detail": "Internal server error."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        ),
        context,
    )