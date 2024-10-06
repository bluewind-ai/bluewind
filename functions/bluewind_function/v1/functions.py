import logging
from functools import wraps

from django.apps import apps
from django.utils import timezone

from domain_names.models import DomainName
from function_calls.models import FunctionCall
from functions.build_function_call_dependencies.v1.functions import (
    build_function_call_dependencies_v1,
)
from functions.build_kwargs_from_dependencies.v1.functions import (
    build_kwargs_from_dependencies_v1,
)
from functions.get_parameter_names.v1.functions import get_parameter_names_v1
from functions.handle_network_calls.v1.functions import handle_network_calls_v1

logger = logging.getLogger("django.not_used")

AUTO_APPROVE = [
    "master_v1",
    "bootstrap_v1",
    "create_function_from_file_v1",
    "approve_function_call_v1",
    "get_function_or_create_from_file_v1",
]


def custom_serialize(queryset):
    return [{"model": obj._meta.model_name, "pk": obj.pk} for obj in queryset]


def custom_deserialize(serialized_data):
    if not serialized_data:
        return DomainName.objects.none()
    model_class = apps.get_model(
        app_label="domain_names", model_name=serialized_data[0]["model"]
    )
    pks = [item["pk"] for item in serialized_data]

    return model_class.objects.filter(pk__in=pks)


def handler_bluewind_function_v1(func, args, kwargs, is_making_network_calls):
    function_call, user = kwargs.get("function_call"), kwargs.get("user")
    check_args_dont_exist(args)
    check_kwargs_valid(func, kwargs)
    if (
        function_call.function.name == func.__name__
        and function_call.status == FunctionCall.Status.RUNNING
    ):
        new_kwargs = build_kwargs_from_dependencies_v1(function_call)

        function_call.status = FunctionCall.Status.RUNNING

        function_call.executed_at = timezone.now()

        if is_making_network_calls:
            result = handle_network_calls_v1(
                function_call=function_call,
                user=user,
                func=func,
                kwargs=new_kwargs,
            )
        else:
            result = func(function_call=function_call, user=user, **new_kwargs)
            if result.__class__.__name__ == "FunctionCall":
                function_call.output_data_dependency = result

        if not FunctionCall.objects.filter(tn_parent=function_call).exists():
            if result == None:
                result = {}
            function_call.status = FunctionCall.Status.COMPLETED_READY_FOR_APPROVAL
            if result.__class__.__name__ == "QuerySet":
                serialized_data = custom_serialize(result)
                function_call.output_data = serialized_data
                function_call.output_type = FunctionCall.OutputType.QUERY_SET
            else:
                function_call.output_data = result
        function_call.save()

    return ask_for_approval(function_call, user, func, kwargs)


def ask_for_approval(function_call, user, func, kwargs):
    from functions.get_function_or_create_from_file.v1.functions import (
        get_function_or_create_from_file_v1,
    )

    function_to_approve = get_function_or_create_from_file_v1(
        function_call=function_call, user=user, function_name=func.__name__
    )
    assert function_to_approve is not None, "function hasn't been found in the DB"
    logger.debug(f"{func.__name__} found in the DB")

    function_call_to_approve = FunctionCall.objects.create(
        function_call=function_call,
        user=user,
        status=FunctionCall.Status.READY_FOR_APPROVAL,
        tn_parent=function_call,
        function=function_to_approve,
    )

    remaining_dependencies = build_function_call_dependencies_v1(
        function_call=function_call,
        user=user,
        function_call_to_approve=function_call_to_approve,
        kwargs=kwargs,
    )
    if remaining_dependencies:
        function_call_to_approve.remaining_dependencies = remaining_dependencies
        function_call_to_approve.status = FunctionCall.Status.CONDITIONS_NOT_MET

    function_call_to_approve.save()
    return function_call_to_approve


def check_kwargs_valid(func, kwargs):
    parameter_names = get_parameter_names_v1(func)
    for kwarg in kwargs:
        if kwarg not in parameter_names:
            raise Exception(
                f"The function {func.__name__} uses a kwarg '{kwarg}' which doesn't exist"
            )


def check_args_dont_exist(args):
    if args:
        raise Exception("args not supported")


def bluewind_function_v1(is_making_network_calls=False, redirect=None):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            return handler_bluewind_function_v1(
                func, args, kwargs, is_making_network_calls
            )

        return wrapper

    return decorator
