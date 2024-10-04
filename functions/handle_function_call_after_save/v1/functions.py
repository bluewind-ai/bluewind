import logging

from django.utils import timezone

from function_calls.models import FunctionCall
from functions.handle_mark_function_call_as_successful.v1.functions import (
    update_related_function_calls_v1,
)

logger = logging.getLogger("django.temp")


def handle_function_call_after_save_v1(object):
    object.function_call.status = FunctionCall.Status.COMPLETED
    object.function_call.output_data = {
        "domain_name": [object.id],
    }
    object.function_call.executed_at = timezone.now()
    object.function_call.output_type = FunctionCall.OutputType.QUERY_SET

    object.function_call.save()
    update_related_function_calls_v1(object.function_call)
