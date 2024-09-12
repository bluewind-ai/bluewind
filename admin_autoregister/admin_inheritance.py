import inspect

from django.contrib import admin
from django.core.exceptions import ImproperlyConfigured

# Try to import InWorkspace, but don't raise an error if it's not found
try:
    from base_model_admin.admin import InWorkspace
except ImportError:
    InWorkspace = None

# Whitelist of model names whose admin can inherit directly from admin.ModelAdmin
MODEL_ADMIN_WHITELIST = {
    "EmailAddress",
    "SocialApp",
    "SocialToken",
    "SocialAccount",
    "Group",
    "Site",
    "LogEntry",
    "Permission",
    "ContentType",
    "Session",
    "Workspace",
    "WorkspaceUser",
    "EmailConfirmation",
    "User",
    "APICall",
    "Migration",
}


def check_admin_inheritance():
    if InWorkspace is None:
        # If InWorkspace is not available, we can't perform the check
        return

    issues = []

    for model, model_admin in admin.site._registry.items():
        if (
            isinstance(model_admin, admin.ModelAdmin)
            and not isinstance(model_admin, InWorkspace)
            and model._meta.object_name not in MODEL_ADMIN_WHITELIST
        ):
            admin_class = model_admin.__class__
            module = inspect.getmodule(admin_class)
            file_path = inspect.getfile(admin_class)

            issues.append(
                f"Admin for {model.__name__} ({admin_class.__name__}) "
                f"should inherit from InWorkspace, not directly from admin.ModelAdmin.\n"
                f"Defined in module: {module.__name__}\n"
                f"File: {file_path}"
            )

    if issues:
        raise ImproperlyConfigured("\n\n".join(issues))
