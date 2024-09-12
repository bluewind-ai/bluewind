import sys
import uuid
from pprint import pprint

from django.http import Http404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


class UUID(uuid.UUID):
    def __init__(
        self,
        int: int | None = None,
        version: int | None = None,
        *,
        is_safe: uuid.SafeUUID = uuid.SafeUUID.unknown,
    ) -> None:
        if int is not None:
            if not 0 <= int < 1 << 128:
                raise ValueError("int is out of range (need a 128-bit value)")
        if version is not None:
            if not 1 <= version <= 7:
                raise ValueError("illegal version number")
            # Set the variant to RFC 4122.
            int &= ~(0xC000 << 48)  # type: ignore
            int |= 0x8000 << 48  # type: ignore
            # Set the version number.
            int &= ~(0xF000 << 64)  # type: ignore
            int |= version << 76  # type: ignore
        object.__setattr__(self, "int", int)
        object.__setattr__(self, "is_safe", is_safe)


_last_v7_timestamp = None


def uuid7():
    """The UUIDv7 format is designed to encode a Unix timestamp with
    arbitrary sub-second precision.  The key property provided by UUIDv7
    is that timestamp values generated by one system and parsed by
    another are guaranteed to have sub-second precision of either the
    generator or the parser, whichever is less.  Additionally, the system
    parsing the UUIDv7 value does not need to know which precision was
    used during encoding in order to function correctly."""

    global _last_v7_timestamp
    import random
    import time

    nanoseconds = time.time_ns()
    if _last_v7_timestamp is not None and nanoseconds <= _last_v7_timestamp:
        nanoseconds = _last_v7_timestamp + 1
    _last_v7_timestamp = nanoseconds
    timestamp_s, timestamp_ns = divmod(nanoseconds, 10**9)
    subsec_a = timestamp_ns >> 18
    subsec_b = (timestamp_ns >> 6) & 0x0FFF
    subsec_seq_node = (timestamp_ns & 0x3F) << 56
    subsec_seq_node += random.SystemRandom().getrandbits(56)
    uuid_int = (timestamp_s & 0x0FFFFFFFFF) << 92
    uuid_int += subsec_a << 80
    uuid_int += subsec_b << 64
    uuid_int += subsec_seq_node
    return UUID(int=uuid_int, version=7)


def get_queryset(cls, request):
    from workspaces.models import Workspace

    # Get the base queryset without filtering
    qs = cls.model.objects.all()

    workspace_id = request.environ.get("WORKSPACE_ID")
    if cls.model == Workspace:
        return qs.filter(id=workspace_id)

    # Check if the model has a workspace field
    if hasattr(cls.model, "workspace"):
        return qs.filter(workspace_id=workspace_id).select_related("workspace")

    return qs


def dd(*args):
    for arg in args:
        pprint(arg)
    sys.exit(1)


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if isinstance(exc, Http404):
        return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

    return response
