import logging

from django.core.management import call_command
from django.utils import timezone

from bluewind.context_variables import (
    set_function,
    set_function_call,
    set_superuser,
    set_workspace,
)
from function_calls.models import FunctionCall
from functions.get_function_or_create_from_file.v1.functions import (
    get_function_or_create_from_file_v1,
)
from users.models import User
from workspaces.models import Workspace

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

    set_superuser(superuser)

    set_workspace(Workspace.objects.create(name="superuser", user=superuser))

    master_v1_function = get_function_or_create_from_file_v1(function_name="master_v1")
    set_function(master_v1_function)

    status = FunctionCall.Status.RUNNING
    master_v1_function_call = FunctionCall.objects.create(
        status=status,
        function=master_v1_function,
        tn_parent=None,
        executed_at=timezone.now(),
    )
    set_function_call(master_v1_function_call)
    status = FunctionCall.Status.COMPLETED
    FunctionCall.objects.create(
        status=status,
        executed_at=timezone.now(),
        function=get_function_or_create_from_file_v1(function_name="bootstrap_v1"),
        tn_parent=master_v1_function_call,
    )
