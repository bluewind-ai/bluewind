import logging

from django.contrib.auth.models import Permission
from django.urls import reverse

logger = logging.getLogger("django.temp")


import logging


def command_palette_get_commands():
    admin_links = {}
    logger = logging.getLogger(__name__)
    logger.debug("Starting command_palette_get_commands function")
    logger.debug("Getting admin links")

    for perm in Permission.objects.select_related("content_type").all():
        app_label = perm.content_type.app_label.replace("_", " ").title()
        model_name = perm.content_type.model.replace("_", " ").title()
        logger.debug(f"Processing permission: {perm} for {app_label} - {model_name}")

        if app_label not in admin_links:
            try:
                url = reverse(
                    f"admin:{perm.content_type.app_label}_{perm.content_type.model}_changelist"
                )
                logger.debug(f"Generated URL: {url}")
                admin_links[app_label] = {
                    "name": f"{app_label} - {model_name}s",
                    "url": url,
                }
                logger.debug(f"Added admin link for {app_label}")
            except BaseException as e:
                logger.warning(
                    f"Failed to reverse URL for {app_label} - {model_name}: {str(e)}"
                )
                pass  # If the URL can't be reversed, skip this admin link

    logger.debug(f"Total admin links gathered: {len(admin_links)}")

    # Convert dictionary to list and sort
    result = sorted(admin_links.values(), key=lambda x: x["name"])
    logger.debug(f"Sorted result list length: {len(result)}")

    logger.debug("Finished command_palette_get_commands function")
    return {"commands": result}
