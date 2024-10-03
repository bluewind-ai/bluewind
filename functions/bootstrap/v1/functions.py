import logging

from django.core.management import call_command
from django.utils import timezone

from bluewind.context_variables import (
    set_function,
    set_function_call,
    set_workspace,
)
from function_calls.models import FunctionCall
from functions.create_function_from_file.v1.functions import (
    create_function_from_file_v1,
)
from users.models import User
from workspaces.models import Workspace

logger = logging.getLogger("django.not_used")


def bootstrap_v1():
    call_command(
        "createsuperuser",
        username="wayne@bluewind.ai",
        email="wayne@bluewind.ai",
        interactive=False,
    )

    user = User.objects.get(username="wayne@bluewind.ai")
    user.set_password("changeme123")
    user.save()
    superuser = User.objects.get(username="wayne@bluewind.ai")

    set_workspace(Workspace.objects.create(name="superuser", user=superuser))

    master_v1_function = create_function_from_file_v1(function_name="master_v1")
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
        function=create_function_from_file_v1(function_name="bootstrap_v1"),
        tn_parent=master_v1_function_call,
    )
