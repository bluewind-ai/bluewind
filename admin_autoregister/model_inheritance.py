import logging

from admin_autoregister.whitelist import MODEL_WHITELIST
from django.apps import apps
from django.core.exceptions import ImproperlyConfigured

logger = logging.getLogger(__name__)


def check_model_inheritance():
    logger.info("Starting check_model_inheritance")

    # Find WorkspaceRelated
    WorkspaceRelated = None
    logger.info("Searching for WorkspaceRelated class")
    for app_config in apps.get_app_configs():
        logger.debug(f"Checking app: {app_config.name}")
        if hasattr(app_config.models_module, "WorkspaceRelated"):
            WorkspaceRelated = getattr(app_config.models_module, "WorkspaceRelated")
            logger.info(f"Found WorkspaceRelated in {app_config.name}")
            break

    if WorkspaceRelated is None:
        logger.error("WorkspaceRelated class not found. This is a critical error.")
        raise ImproperlyConfigured(
            "WorkspaceRelated class not found in any installed app."
        )

    issues = []

    for app_config in apps.get_app_configs():
        for model in app_config.get_models():
            logger.debug(f"Checking model: {app_config.name}.{model.__name__}")
            if (
                model.__name__ != "WorkspaceRelated"
                and not issubclass(model, WorkspaceRelated)
                and model._meta.object_name not in MODEL_WHITELIST
                and not model._meta.abstract
            ):
                logger.warning(
                    f"Model {model.__name__} does not inherit from WorkspaceRelated"
                )
                module = model.__module__
                issues.append(
                    f"Model {model.__name__} should inherit from WorkspaceRelated.\n"
                    f"Defined in module: {module}"
                )

    if issues:
        for issue in issues:
            logger.error(issue)
        raise ImproperlyConfigured("\n\n".join(issues))
    else:
        logger.info("All models inherit from WorkspaceRelated correctly.")


logger.info("model_inheritance.py module loaded")
