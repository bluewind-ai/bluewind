import logging

from django.db import transaction

from function_call_dependencies.models import FunctionCallDependency
from function_calls.models import FunctionCall

logger = logging.getLogger("django.not_used")


import logging

logger = logging.getLogger("django.not_used")


import logging

logger = logging.getLogger("django.temp")


def handle_function_call_after_save_v1(object):
    with transaction.atomic():
        object.function_call.status = FunctionCall.Status.COMPLETED
        object.function_call.save()
        # FunctionVariable.objects.filter(
        #     function=object.function_call.function,
        #     type=FunctionVariable.Type.OUTPUT,
        # )
        # FunctionVariable.objects.create(
        #     function=object.function_call.function,
        #     name=object.name,
        #     type=FunctionVariable.Type.OUTPUT,
        #     order=object.order,
        #     model=object.model,
        # )

        dependencies = FunctionCallDependency.objects.filter(
            dependency=object.function_call,
        )
        for dependency in dependencies:
            dependency.data = {"domain_name": [object.id]}
            dependency.save()
            dependency.dependent.remaining_dependencies -= 1
            if dependency.dependent.remaining_dependencies == 0:
                dependency.dependent.status = FunctionCall.Status.READY_FOR_APPROVAL
            dependency.dependent.save()

        # form_class = import_form_using_db_object_v1(output_form_data)
        # if form_class(data={"name": 1}).is_valid():
        #     raise Exception("Form is valid")
        # else:
        #     raise Exception(
        #         f"Form is invalid: {form_class(data={'domain_name': 1}).errors}"
        #     )
