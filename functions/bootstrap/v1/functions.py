import logging

from bluewind.context_variables import (
    set_function,
    set_function_call,
)
from function_calls.models import FunctionCall
from functions.create_function_from_file.v1.functions import (
    create_function_from_file_v1,
)
from users.models import User
from workspaces.models import Workspace

logger = logging.getLogger("django.not_used")


def bootstrap_v1():
    superuser = User.objects.get(username="wayne@bluewind.ai")
    Workspace.objects.create(name="superuser", user=superuser)
    master_v1_function = create_function_from_file_v1(function_name="master_v1")
    set_function(master_v1_function)

    status = FunctionCall.Status.RUNNING
    master_v1_function_call = FunctionCall.objects.create(status=status)
    set_function_call(master_v1_function_call)
