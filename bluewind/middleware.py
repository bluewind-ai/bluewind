from allauth.account.views import redirect
from django.http import HttpResponseNotFound

from bluewind.context_variables import (
    get_log_records,
    get_workspace_id,
    set_log_records,
    set_request_id,
)
from bluewind.push_logs import push_logs_to_db
from incoming_http_requests.models import IncomingHTTPRequest
from workspaces.models import Workspace, WorkspaceUser


def custom_middleware(get_response):
    def middleware(request):
        # Initialize log records
        set_log_records([])

        # Get workspace_id from context variables (set by WSGI)
        workspace_id = get_workspace_id()
        user_id = 2
        # Create IncomingHTTPRequest with minimal info and set request_id
        incoming_request = IncomingHTTPRequest.objects.create(
            workspace_id=workspace_id,
            user_id=user_id,  # We'll update this later
        )
        set_request_id(str(incoming_request.id))
        response = get_response(request)
        # Get user_id and request_id after the response
        if request.user.is_authenticated:
            user_id = request.user.id
            IncomingHTTPRequest.objects.filter(id=incoming_request.id).update(
                user_id=user_id
            )

        # Update IncomingHTTPRequest with user_id after the response

        # Push logs to database
        push_logs_to_db(user_id, workspace_id, get_log_records())

        return response

    return middleware


def admin_middleware(get_response):
    def middleware(request):
        if request.path == "/":
            return redirect("/workspaces/2/accounts/login/")
        if request.path == "/workspaces/2/accounts/login/":
            return get_response(request)
        if not request.user.is_authenticated:
            return redirect("/workspaces/2/accounts/login/")
        workspace_id = get_workspace_id()
        if WorkspaceUser.objects.filter(
            user_id=request.user.id, workspace_id=workspace_id
        ):  # User asks for a workspace he has access to
            if workspace_id == 2:
                return redirect("/workspaces/1/admin/")
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
