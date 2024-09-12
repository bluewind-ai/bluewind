import inspect

from django.apps import apps
from django.core.exceptions import ImproperlyConfigured

# Try to import WorkspaceRelated, but don't raise an error if it's not found
try:
    from base_model.models import WorkspaceRelated
except ImportError:
    WorkspaceRelated = None

# Whitelist of model names that don't need to inherit from WorkspaceRelated
MODEL_WHITELIST = {
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


def check_model_inheritance():
    if WorkspaceRelated is None:
        # If WorkspaceRelated is not available, we can't perform the check
        return

    issues = []

    for model in apps.get_models():
        if (
            not issubclass(model, WorkspaceRelated)
            and model._meta.object_name not in MODEL_WHITELIST
        ):
            module = inspect.getmodule(model)
            file_path = inspect.getfile(model)

            issues.append(
                f"Model {model.__name__} should inherit from WorkspaceRelated.\n"
                f"Defined in module: {module.__name__}\n"
                f"File: {file_path}"
            )

    if issues:
        raise ImproperlyConfigured("\n\n".join(issues))
