# core/middleware.py

from __future__ import annotations

import uuid
from core.utils import get_client_ip



class RequestIDMiddleware:
    header_name = "X-Request-ID"
    meta_key = "HTTP_X_REQUEST_ID"

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = request.META.get(self.meta_key) or str(uuid.uuid4())
        request.request_id = request_id
        response = self.get_response(request)
        response[self.header_name] = request_id
        return response

class ClientIPMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.client_ip = get_client_ip(request)
        return self.get_response(request)