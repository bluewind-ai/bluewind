import logging

from django.contrib.auth.models import Permission
from django.urls import reverse

logger = logging.getLogger("django.temp")


def command_palette_get_commands(workspace):
    admin_links = {}
    logger.debug("Getting admin links")
    for perm in Permission.objects.select_related("content_type").all():
        app_label = perm.content_type.app_label.replace("_", " ").title()
        model_name = perm.content_type.model.replace("_", " ").title()

        if app_label not in admin_links:
            try:
                url = reverse(
                    f"admin:{perm.content_type.app_label}_{perm.content_type.model}_changelist"
                )
                admin_links[app_label] = {
                    "name": f"{app_label} - {model_name}s",
                    "url": url,
                }
            except BaseException:
                pass  # If the URL can't be reversed, skip this admin link

    # Convert dictionary to list and sort
    result = sorted(admin_links.values(), key=lambda x: x["name"])

    return result