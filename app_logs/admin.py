from base_admin.admin import InWorkspace


class AppLogAdmin(InWorkspace):
    list_display = (
        "user",
        "message",
        "traceback",
        "timestamp",
        "level",
        "incoming_http_request",  # Updated field name
        "logger",
        "created_at",
    )
    search_fields = ("user__username", "message", "logger")
    list_filter = ("level", "timestamp", "logger")  # Just add 'logger' here
    ordering = ("-timestamp",)
    date_hierarchy = "timestamp"
