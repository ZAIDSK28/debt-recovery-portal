# core/exceptions.py

import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        return response

    view = context.get("view")
    request = context.get("request")

    logger.exception(
        "Unhandled API exception",
        extra={
            "path": getattr(request, "path", None),
            "method": getattr(request, "method", None),
            "view": view.__class__.__name__ if view else None,
        },
        exc_info=exc,
    )

    return Response(
        {"detail": "Internal server error."},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )