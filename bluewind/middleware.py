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
    set_workspace,
)
from bluewind.views import favicon_view


def admin_middleware(get_response):
    def middleware(request):
        # Set initial values for all context variables
        set_request_id(None)
        set_log_records([])
        set_workspace(None)
        set_startup_mode(False)
        set_parent_function_call(None)
        set_approved_function_call(None)
        set_function_call(None)
        set_function(None)
        set_exception_count(0)
        set_file_and_line_where_debugger_with_skipped_option_was_called((None, None))
        set_is_update_entity_function_already_in_the_call_stack(False)

        try:
            if request.path.startswith("/favicon.ico"):
                return favicon_view(request)

            response = get_response(request)
            return response
        except BaseException as e:
            raise e
        finally:
            set_request_id(None)
            set_log_records(None)
            set_workspace(None)
            set_startup_mode(False)  # Reset to default value
            set_parent_function_call(None)
            set_approved_function_call(None)
            set_function_call(None)
            set_function(None)
            set_exception_count(0)
            set_file_and_line_where_debugger_with_skipped_option_was_called(
                (None, None)
            )
            set_is_update_entity_function_already_in_the_call_stack(False)

    return middleware
