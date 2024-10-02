# from django.db import IntegrityError
# from django.http import HttpResponseNotFound
# from django.shortcuts import redirect

# from bluewind.context_variables import (
#     get_log_records,
#     get_workspace_id,
#     set_log_records,
#     set_request_id,
# # )
# # from bluewind.push_logs import push_logs_to_db
# # from flow_runs.models import FlowRun
# # from flows.models import Flow
# # from incoming_http_requests.models import IncomingHTTPRequest
# # from user_settings.models import UserSettings
# # from workspaces.models import Workspace, WorkspaceUser

# # # def sync_only_middleware(middleware_func):
# # #     def wrapper(get_response):
# # #         if asyncio.iscoroutinefunction(get_response):
# # #             raise MiddlewareNotUsed(
# # #                 "This middleware only supports synchronous requests"
# # #             )
# # #         return middleware_func(get_response)

# # #     return wrapper


# # def custom_middleware(get_response):
# #     def middleware(request):
# #         # raise NotImplementedError("This middleware is not implemented")
# #         # Initialize log records
# #         set_log_records([])

# #         # Get workspace_id from context variables (set by WSGI)
# #         workspace_id = get_workspace_id()
# #         user_id = 2
# #         # Create IncomingHTTPRequest with minimal info and set request_id
# #         try:
# #             incoming_request = IncomingHTTPRequest.objects.create(
# #                 workspace_id=workspace_id,
# #                 user_id=user_id,
# #             )
# #         except IntegrityError as e:
# #             error_message = str(e)
# #             if (
# #                 "violates foreign key constraint" in error_message
# #                 and "incoming_http_reques_workspace_id" in error_message
# #             ):
# #                 # This is the specific foreign key violation on workspace_id
# #                 incoming_request = IncomingHTTPRequest.objects.create(
# #                     workspace_id=2,  # Placeholder workspace
# #                     user_id=user_id,
# #                 )
# #                 return HttpResponseNotFound("Workspace not found")
# #             else:
# #                 # Some other IntegrityError we're not handling specifically
# #                 raise e
# #         set_request_id(str(incoming_request.id))
# #         response = get_response(request)
# #         # Get user_id and request_id after the response
# #         if request.path.startswith("/static/"):
# #             # no user_id for static files
# #             push_logs_to_db(user_id, workspace_id, get_log_records())
# #         elif request.user.is_authenticated:
# #             user_id = request.user.id
# #             IncomingHTTPRequest.objects.filter(id=incoming_request.id).update(
# #                 user_id=user_id
# #             )
# #             push_logs_to_db(user_id, workspace_id, get_log_records())

# #         # Update IncomingHTTPRequest with user_id after the response

# #         # Push logs to database

# #         return response

# #     try:
# #         return middleware
# #     except Exception as e:
# #         print(e)


# from bluewind.middleware import redirect
import re

from django.db import transaction
from django.shortcuts import redirect

from bluewind.context_variables import (
    set_approved_function_call,
    set_exception_count,
    set_file_and_line_where_debugger_with_skipped_option_was_called,
    set_function,
    set_function_call,
    set_is_update_entity_function_already_in_the_call_stack,
    set_log_records,
    set_parent_function_call,
    set_request_id,
    set_startup_mode,
    set_workspace_id,
)
from functions.master.v1.functions import master_v1


def process_response(response):
    if response.status_code in [301, 302, 307, 308] and "Location" in response:
        location = response["Location"]
        if location.startswith("/admin/"):
            response["Location"] = location.replace("/admin/", "/", 1)
    elif response.status_code == 200 and "text/html" in response.get(
        "Content-Type", ""
    ):
        content = response.content.decode("utf-8")
        pattern = r'href="(/admin/[^"]*)"'
        content = re.sub(
            pattern,
            lambda m: f'href="{m.group(1).replace("/admin/", "/", 1)}"'
            if m.group(1).startswith("/admin/")
            else m.group(0),
            content,
        )
        response.content = content.encode("utf-8")
    return response


def admin_middleware(get_response):
    def middleware(request):
        if request.path.startswith("/favicon.ico"):
            return get_response(request)
        if not request.path.startswith("/workspaces/"):
            request.path_info = f"/admin{request.path}"
            request.path = f"/workspaces/1/admin{request.path}"
            if request.path == "/workspaces/1/admin/":
                with transaction.atomic():
                    master_v1()
                    return redirect(
                        "/workspaces/1/admin/function_calls/functioncall/1/change"
                    )
            response = get_response(request)
            return process_response(response)

        return get_response(request)

    return middleware


def context_variables_middleware(get_response):
    def middleware(request):
        # with transaction.atomic():  # noqa: F821
        # transaction.set_autocommit(False)

        # Set initial values for all context variables
        set_request_id(None)
        set_log_records([])
        # set_workspace_id(None)
        set_startup_mode(True)
        set_parent_function_call(None)
        set_approved_function_call(None)
        set_function_call(None)
        set_function(None)
        set_exception_count(0)
        set_file_and_line_where_debugger_with_skipped_option_was_called((None, None))
        set_is_update_entity_function_already_in_the_call_stack(False)
        try:
            response = get_response(request)
        except BaseException:
            raise Exception("Error in middleware")
        finally:
            set_request_id(None)
            set_log_records(None)
            set_workspace_id(None)
            set_startup_mode(True)  # Reset to default value
            set_parent_function_call(None)
            set_approved_function_call(None)
            set_function_call(None)
            set_function(None)
            set_exception_count(0)
            set_file_and_line_where_debugger_with_skipped_option_was_called(
                (None, None)
            )
            set_is_update_entity_function_already_in_the_call_stack(False)

        return response

    return middleware
