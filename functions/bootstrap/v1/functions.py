import logging

from django.contrib.auth import get_user_model

from bluewind.context_variables import (
    set_function,
    set_function_call,
)
from function_calls.models import FunctionCall
from functions.create_function_from_file.v1.functions import (
    create_function_from_file_v1,
)
from workspaces.models import Workspace

logger = logging.getLogger("django.not_used")


def bootstrap_v1():
    # Run the createsuperuser command
    User = get_user_model()
    superuser = User.objects.get(username="wayne@bluewind.ai")
    # superuser.set_password("admin")
    # superuser.save()

    # Rest of your function remains the same
    # DomainName.objects.create(name="bluewind.ai")
    # raise_debug("cndsjkcndjsk")
    superuser_workspace = Workspace.objects.create(name="superuser", user=superuser)
    # raise_debug(superuser_workspace)
    master_v1_function = create_function_from_file_v1(function_name="master_v1")
    # master_v1_function = Function.objects.create(
    #     name="master_v1",
    #     file=master_v1_function_file,
    # )
    set_function(master_v1_function)

    status = FunctionCall.Status.RUNNING
    master_v1_function_call = FunctionCall.objects.create(
        status=status, function=master_v1_function
    )
    set_function_call(master_v1_function_call)

    # Anonymous user creation and workspace association
    # anonymous_user = User.objects.create_user(
    #     username="anonymous_user",
    #     email="anonymous@example.com",
    #     password="AnonymousSecurePassword123!",
    # )

    # anonymous_workspace = Workspace.objects.create(
    #     name="Anonymous Workspace", user=superuser
    # )
    # WorkspaceUser.objects.create(
    #     user=anonymous_user, workspace=anonymous_workspace, is_default=True
    # )
    # set_parent_function_call(master_v1_function_call)
