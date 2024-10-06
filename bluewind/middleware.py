from bluewind.context_variables import (
    set_exception_count,
    set_file_and_line_where_debugger_with_skipped_option_was_called,
    set_log_records,
    set_request_id,
    set_startup_mode,
)
from bluewind.views import favicon_view


def admin_middleware(get_response):
    def middleware(request):
        # Set initial values for all context variables
        set_request_id(None)
        set_log_records([])
        set_startup_mode(False)
        set_exception_count(0)
        set_file_and_line_where_debugger_with_skipped_option_was_called((None, None))

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
            set_startup_mode(False)  # Reset to default value
            set_exception_count(0)
            set_file_and_line_where_debugger_with_skipped_option_was_called(
                (None, None)
            )

    "cdcdscdscds"
    return middleware
