import logging

from django.db.models import Q

from function_call_dependencies.models import FunctionCallDependency
from function_calls.models import FunctionCall

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


def snake_to_camel_case_uppercase(snake_str):
    components = snake_str.split("_")
    return "".join(x.capitalize() for x in components)


def handle_mark_function_call_as_successful_v1(function_call_id):
    function_call = FunctionCall.objects.get(id=int(function_call_id))
    function_call.status = FunctionCall.Status.MARKED_SUCCESSFUL

    update_related_function_calls_v1(function_call)

    function_call.save()


def get_siblings_in_uncompleted_stages_v1(function_call):
    test = FunctionCall.objects.filter(
        ~Q(id__in=[function_call.id]),
        tn_parent=function_call.tn_parent,
        status__in=FunctionCall.uncompleted_stages(),
    )

    return test


def update_related_function_calls_v1(function_call):
    dependencies = FunctionCallDependency.objects.filter(
        dependency=function_call,
    )

    for dependency in dependencies:
        dependency.dependent.remaining_dependencies -= 1

        dependency.dependent.input_data[dependency.name] = (
            dependency.dependency.output_data
        )

        if dependency.dependent.remaining_dependencies == 0:
            dependency.dependent.status = FunctionCall.Status.READY_FOR_APPROVAL
        dependency.dependent.save()

    FunctionCall.objects.filter(
        output_data_dependency=function_call,
    ).update(
        output_data=function_call.output_data, output_type=function_call.output_type
    )
    if function_call.tn_parent:
        function_call.tn_parent.refresh_from_db()
        exists = get_siblings_in_uncompleted_stages_v1(function_call).exists()

        if not exists:
            function_call.tn_parent.status = (
                FunctionCall.Status.COMPLETED_READY_FOR_APPROVAL
            )
            function_call.tn_parent.save()
