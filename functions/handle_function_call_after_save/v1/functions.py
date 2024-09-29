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
        output_form_data.data = {"domain_name": 1}
        output_form_data.save()
        FunctionCall.objects.filter(input_form_data=output_form_data).update(
            status=FunctionCall.Status.READY_FOR_APPROVAL
        )
        object.function_call.status = FunctionCall.Status.COMPLETED
        object.function_call.save()
        # form_class = import_form_using_db_object_v1(output_form_data)
        # if form_class(data={"name": 1}).is_valid():
        #     raise Exception("Form is valid")
        # else:
        #     raise Exception(
        #         f"Form is invalid: {form_class(data={'domain_name': 1}).errors}"
        #     )
