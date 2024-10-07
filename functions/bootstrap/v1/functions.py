import logging

from django.core.management import call_command
from django.utils import timezone

from function_calls.models import FunctionCall
from functions.get_function_or_create_from_file.v1.functions import (
    get_function_or_create_from_file_v1,
)
from users.models import User

logger = logging.getLogger("django.not_used")


def bootstrap_v1():
    superuser = User.objects.filter(username="wayne@bluewind.ai").first()
    if not superuser:
        call_command(
            "createsuperuser",
            username="wayne@bluewind.ai",
            email="wayne@bluewind.ai",
            interactive=False,
        )
        superuser = User.objects.get(username="wayne@bluewind.ai")

        superuser.set_password("changeme123")
        superuser.save()

    master_v1_function = get_function_or_create_from_file_v1(
        function_call=None, user=superuser, function_name="master_v1"
    )

    status = FunctionCall.Status.RUNNING
    master_v1_function_call = FunctionCall.objects.create(
        user=superuser,
        status=status,
        function=master_v1_function,
        parent=None,
        executed_at=timezone.now(),
    )
    status = FunctionCall.Status.COMPLETED
    FunctionCall.objects.create(
        user=superuser,
        status=status,
        executed_at=timezone.now(),
        function=get_function_or_create_from_file_v1(
            function_call=master_v1_function_call,
            user=superuser,
            function_name="bootstrap_v1",
        ),
        parent=master_v1_function_call,
    )
    return master_v1_function_call, superuser
