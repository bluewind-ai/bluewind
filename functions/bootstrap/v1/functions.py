import logging

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.db import transaction
from django.shortcuts import redirect

from bluewind.context_variables import set_function, set_function_call
from files.models import File
from function_calls.models import FunctionCall
from functions.models import Function
from workspaces.models import Workspace, WorkspaceUser

logger = logging.getLogger("django.not_used")


def bootstrap_v1():
    # Run the createsuperuser command
    with transaction.atomic():
        call_command(
            "createsuperuser",
            "--noinput",
            username="wayne@bluewind.ai",
            email="wayne@bluewind.ai",
        )

        User = get_user_model()
        superuser = User.objects.get(username="wayne@bluewind.ai")
        superuser.set_password("admin")
        superuser.save()

        # Rest of your function remains the same
        superuser_workspace = Workspace.objects.create(name="superuser", user=superuser)
        superuser_function_file = File.objects.create(
            path="/Users/merwanehamadi/code/bluewind/functions/superuser_function/v1/functions",
            content="I am the Alpha and the Omega, the First and the Last, the Beginning and the End.",
        )
        superuser_function = Function.objects.create(
            name="superuser_function_v1",
            file=superuser_function_file,
        )
        set_function(superuser_function)

        status = FunctionCall.Status.READY_FOR_APPROVAL
        superuser_function_call = FunctionCall.objects.create(
            status=status, function=superuser_function
        )
        set_function_call(superuser_function_call)

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

        return redirect(
            f"/workspaces/1/admin/function_calls/functioncall/{superuser_function_call.id}/change"
        )
