from base_model_admin.admin import InWorkspace


class QueryLogAdmin(InWorkspace):
    list_display = (
        "timestamp",
        "app_label",
        "level",
        "execution_time",
        "user",
        "workspace",
    )
