import logging

from django.db import transaction

from function_calls.models import FunctionCall

logger = logging.getLogger("django.not_used")


import logging

logger = logging.getLogger("django.not_used")


import logging

logger = logging.getLogger("django.temp")


def handle_function_call_after_save_v1(object):
    with transaction.atomic():
        output_form_data = object.function_call.output_form_data
        output_form_data.data = {"ok": "ok"}
        output_form_data.save()
        function_calls_using_this_output_as_an_input = FunctionCall.objects.filter(
            input_form_data=output_form_data
        ).update(status=FunctionCall.Status.READY_FOR_APPROVAL)
        object.function_call.status = FunctionCall.Status.COMPLETED
