import logging

from django.utils import timezone

from function_call_dependencies.models import FunctionCallDependency
from function_calls.models import FunctionCall

logger = logging.getLogger("django.temp")


def handle_function_call_after_save_v1(object):
    object.function_call.status = FunctionCall.Status.COMPLETED_READY_FOR_APPROVAL
    object.function_call.output_data = {
        "domain_name": [object.id],
    }
    object.function_call.executed_at = timezone.now()
    object.function_call.output_type = FunctionCall.OutputType.QUERY_SET

    object.function_call.save()
    dependencies = FunctionCallDependency.objects.filter(
        dependency=object.function_call,
    )
    for dependency in dependencies:
        dependency.dependent.remaining_dependencies -= 1
        if dependency.dependent.remaining_dependencies == 0:
            dependency.dependent.status = FunctionCall.Status.READY_FOR_APPROVAL
        dependency.dependent.save()
