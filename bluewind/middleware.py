from allauth.account.views import redirect
from django.db import IntegrityError
from django.http import HttpResponseNotFound

from bluewind.context_variables import (
    get_log_records,
    get_workspace_id,
    set_log_records,
    set_request_id,
)
from bluewind.push_logs import push_logs_to_db
from flow_runs.models import FlowRun
from flows.models import Flow
from incoming_http_requests.models import IncomingHTTPRequest
from user_settings.models import UserSettings
from workspaces.models import Workspace, WorkspaceUser

# def sync_only_middleware(middleware_func):
#     def wrapper(get_response):
#         if asyncio.iscoroutinefunction(get_response):
#             raise MiddlewareNotUsed(
#                 "This middleware only supports synchronous requests"
#             )
#         return middleware_func(get_response)

#     return wrapper


def custom_middleware(get_response):
    def middleware(request):
        # raise NotImplementedError("This middleware is not implemented")
        # Initialize log records
        set_log_records([])

        # Get workspace_id from context variables (set by WSGI)
        workspace_id = get_workspace_id()
        user_id = 2
        # Create IncomingHTTPRequest with minimal info and set request_id
        try:
            incoming_request = IncomingHTTPRequest.objects.create(
                workspace_id=workspace_id,
                user_id=user_id,
            )
        except IntegrityError as e:
            error_message = str(e)
            if (
                "violates foreign key constraint" in error_message
                and "incoming_http_reques_workspace_id" in error_message
            ):
                # This is the specific foreign key violation on workspace_id
                incoming_request = IncomingHTTPRequest.objects.create(
                    workspace_id=2,  # Placeholder workspace
                    user_id=user_id,
                )
                return HttpResponseNotFound("Workspace not found")
            else:
                # Some other IntegrityError we're not handling specifically
                raise e
        set_request_id(str(incoming_request.id))
        response = get_response(request)
        # Get user_id and request_id after the response
        if request.path.startswith("/static/"):
            # no user_id for static files
            push_logs_to_db(user_id, workspace_id, get_log_records())
        elif request.user.is_authenticated:
            user_id = request.user.id
            IncomingHTTPRequest.objects.filter(id=incoming_request.id).update(
                user_id=user_id
            )
            push_logs_to_db(user_id, workspace_id, get_log_records())

        # Update IncomingHTTPRequest with user_id after the response

        # Push logs to database

        return response

    try:
        return middleware
    except Exception as e:
        print(e)


def admin_middleware(get_response):
    def middleware(request):
        if request.path.startswith("/health/"):
            return get_response(request)
        if request.path.startswith("/silk/"):
            return get_response(request)
        if request.path == "/":
            return redirect("/workspaces/2/accounts/login/")
        if request.path == "/workspaces/2/accounts/login/":
            return get_response(request)
        if not request.user.is_authenticated:
            return redirect("/workspaces/2/accounts/login/")

        workspace_id = get_workspace_id()
        # if "/workspaces/1/admin/flow_runs/flowrun/add" in request.path:
        #     return get_response(request)
        if WorkspaceUser.objects.filter(
            user_id=request.user.id, workspace_id=workspace_id
        ):  # User asks for a workspace he has access to
            if workspace_id == 2:
                return redirect("/workspaces/1/admin/")
            return flow_mode(request, get_response)
            return get_response(request)
        if (
            WorkspaceUser.objects.filter(user_id=request.user.id).count() == 0
        ):  # User has no workspace
            workspace = Workspace.objects.create(name=request.user.username)
            WorkspaceUser.objects.create(
                user=request.user, workspace=workspace, is_default=True
            )
            redirect_url = f"/workspaces/{workspace.id}/admin/"
            return redirect(redirect_url)

        return HttpResponseNotFound("Page not found")

    return middleware


"cdscdscds"
"cdscdscsd"


def flow_mode(request, get_response):
    if (
        request.path.startswith("/workspaces/1/admin/flow_runs/flowrun/")
        and "logout" not in request.path
    ):
        return get_response(request)
    user_settings = UserSettings.objects.filter(user_id=request.user.id).first()
    if user_settings and user_settings.mode == UserSettings.Mode.FLOW:
        flow_run = FlowRun.objects.filter(
            status=FlowRun.Status.READY_FOR_APPROVAL,
        ).first()
        if not flow_run:
            flow_to_run = Flow.filter(name="deliver_value")
        else:
            flow_to_run = flow_run
        return redirect(
            f"/workspaces/1/admin/flow_runs/flowrun/add/?flow={flow_to_run.id}"
        )

    return get_response(request)
