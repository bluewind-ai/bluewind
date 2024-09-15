import logging

from django.apps import apps
from django.core.exceptions import ImproperlyConfigured

from admin_autoregister.whitelist import MODEL_WHITELIST

logger = logging.getLogger(__name__)

CUSTOM_WHITELIST = {
    "Entity",
    "FlowRunArgument",
}

WHITELIST = CUSTOM_WHITELIST | MODEL_WHITELIST


def check_unique_constraints():
    logger.info("Starting check_unique_constraints")
    issues = []

    for app_config in apps.get_app_configs():
        for model in app_config.get_models():
            logger.debug(f"Checking model: {app_config.name}.{model.__name__}")

            if model._meta.object_name in WHITELIST:
                logger.debug(f"Skipping exempt model: {model.__name__}")
                continue

            field_names = set(f.name for f in model._meta.fields)

            if "name" in field_names:
                unique_constraints = set()
                for constraint in model._meta.constraints:
                    if constraint.__class__.__name__ == "UniqueConstraint":
                        unique_constraints.update(constraint.fields)

                for unique_together in model._meta.unique_together:
                    unique_constraints.update(unique_together)

                if "workspace" in field_names and "name" not in unique_constraints:
                    issues.append(
                        f"Model {model.__name__} has 'name' and 'workspace' fields "
                        f"but lacks a unique constraint including 'name'.\n"
                        f"Defined in module: {model.__module__}"
                    )
                elif (
                    "workspace" not in field_names and "name" not in unique_constraints
                ):
                    issues.append(
                        f"Model {model.__name__} has a 'name' field "
                        f"but lacks any unique constraint including 'name'.\n"
                        f"Defined in module: {model.__module__}"
                    )

    if issues:
        for issue in issues:
            logger.error(issue)
        raise ImproperlyConfigured("\n\n".join(issues))
    else:
        logger.info("All relevant models have appropriate unique constraints.")


logger.info("unique_constraints_check.py module loaded")
