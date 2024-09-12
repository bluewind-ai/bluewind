import logging

from django.apps import apps
from django.core.exceptions import ImproperlyConfigured

from admin_autoregister.whitelist import MODEL_WHITELIST

logger = logging.getLogger(__name__)
CUSTOM_WHITELIST = {"Entity"}

NAME_WORKSPACE_UNIQUE_TOGETHER = MODEL_WHITELIST | CUSTOM_WHITELIST


def check_unique_together_constraint():
    logger.info("Starting check_unique_together_constraint")

    issues = []

    for app_config in apps.get_app_configs():
        for model in app_config.get_models():
            logger.debug(f"Checking model: {app_config.name}.{model.__name__}")

            # Skip models in the whitelist
            if model._meta.object_name in NAME_WORKSPACE_UNIQUE_TOGETHER:
                logger.debug(f"Skipping whitelisted model: {model.__name__}")
                continue

            # Check if the model has a 'name' field
            if "name" in [f.name for f in model._meta.fields]:
                # Check if the model has the correct unique_together constraint
                if (
                    not model._meta.unique_together
                    or ("name", "workspace") not in model._meta.unique_together
                ):
                    logger.warning(
                        f"Model {model.__name__} has a 'name' field but doesn't have the correct unique_together constraint"
                    )
                    module = model.__module__
                    issues.append(
                        f"Model {model.__name__} has a 'name' field but doesn't have "
                        f"('name', 'workspace') in its unique_together constraint.\n"
                        f"Defined in module: {module}"
                    )

    if issues:
        for issue in issues:
            logger.error(issue)
        raise ImproperlyConfigured("\n\n".join(issues))
    else:
        logger.info(
            "All relevant models with 'name' field have correct unique_together constraint."
        )


logger.info("unique_together_check.py module loaded")
