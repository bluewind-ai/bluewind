import logging

from django.utils import timezone

from domain_names.models import DomainName
from function_calls.models import FunctionCall
from functions.bluewind_function.v1.functions import custom_serialize
from functions.handle_mark_function_call_as_successful.v1.functions import (
    update_related_function_calls_v1,
)

logger = logging.getLogger("django.not_used")


def handle_function_call_after_save_v1(object):
    object.function_call.status = FunctionCall.Status.COMPLETED
    query_set = DomainName.objects.filter(id=object.id)
    serialized_data = custom_serialize(query_set)
    object.function_call.output_data = serialized_data
    object.function_call.executed_at = timezone.now()
    object.function_call.output_type = FunctionCall.OutputType.QUERY_SET

    object.function_call.save()

    update_related_function_calls_v1(object.function_call)
