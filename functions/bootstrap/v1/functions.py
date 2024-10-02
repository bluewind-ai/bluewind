import logging

from django.contrib.auth import get_user_model
from django.db import transaction
from django.shortcuts import redirect

from bluewind.context_variables import set_function, set_function_call
from function_calls.models import FunctionCall
from functions.bluewind_function.v1.functions import bluewind_function_v1
from functions.create_function_from_file.v1.functions import (
    create_function_from_file_v1,
)
from workspaces.models import Workspace, WorkspaceUser

logger = logging.getLogger("django.not_used")


@bluewind_function_v1()
def bootstrap_v1():
    # Run the createsuperuser command
    with transaction.atomic():
        User = get_user_model()
        superuser = User.objects.get(username="wayne@bluewind.ai")
        superuser.set_password("admin")
        superuser.save()

        # Rest of your function remains the same
        superuser_workspace = Workspace.objects.create(name="superuser", user=superuser)
        master_v1_function = create_function_from_file_v1("master_v1")

        # master_v1_function = Function.objects.create(
        #     name="master_v1",
        #     file=master_v1_function_file,
        # )
        set_function(master_v1_function)

        status = FunctionCall.Status.READY_FOR_APPROVAL
        master_v1_function_call = FunctionCall.objects.create(
            status=status, function=master_v1_function
        )
        set_function_call(master_v1_function_call)

        # Anonymous user creation and workspace association
        anonymous_user = User.objects.create_user(
            username="anonymous_user",
            email="anonymous@example.com",
            password="AnonymousSecurePassword123!",
        )

        anonymous_workspace = Workspace.objects.create(
            name="Anonymous Workspace", user=superuser
        )
        WorkspaceUser.objects.create(
            user=anonymous_user, workspace=anonymous_workspace, is_default=True
        )
    # raise_debug(
    #     superuser.id,
    #     User.objects.filter(username="wayne@bluewind.ai").first(),
    #     get_workspace_id(),
    # )
    return redirect(
        f"/workspaces/2/admin/function_calls/functioncall/{master_v1_function_call.id}/change"
    )
