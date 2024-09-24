import logging

from django.contrib.auth.models import Permission
from django.urls import reverse

logger = logging.getLogger(__name__)


def command_palette_get_commands(function_run):
    logger.debug("Starting command_palette_get_commands function")

    logger.debug("Getting permission admin links")
    permission_admin_links = get_permission_admin_links()
    logger.debug(f"Permission admin links type: {type(permission_admin_links)}")
    logger.debug(f"Permission admin links: {permission_admin_links}")

    logger.debug("Getting flow admin links")
    flow_admin_links = get_flow_admin_links()
    logger.debug(f"Flow admin links type: {type(flow_admin_links)}")
    logger.debug(f"Flow admin links: {flow_admin_links}")

    admin_links = {}
    if isinstance(permission_admin_links, dict):
        admin_links.update(permission_admin_links)
    if isinstance(flow_admin_links, dict):
        admin_links.update(flow_admin_links)

    logger.debug(f"Total admin links gathered: {len(admin_links)}")

    result = sorted(admin_links.values(), key=lambda x: x["name"])
    logger.debug(f"Sorted result list length: {len(result)}")

    logger.debug("Finished command_palette_get_commands function")
    return {"commands": result}


def get_flow_admin_links():
    from flows.models import Flow

    flows = Flow.objects.all()

    admin_links = {}
    for flow in flows:
        logger.debug(f"Processing flow: {flow}")

        try:
            # URL for the custom action (add flow run)
            custom_action_url = flow.get_custom_action_url()

            admin_links[f"Run {flow.name}"] = {
                "name": f"Run {flow.name}",
                "url": custom_action_url,
            }
            logger.debug(f"Added admin link for Flow - {flow.name}")
        except Exception as e:
            logger.warning(
                f"Failed to generate admin link for Flow - {flow.name}: {str(e)}"
            )

    return admin_links


def get_permission_admin_links():
    permissions = Permission.objects.select_related("content_type").all()

    admin_links = {}
    for perm in permissions:
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
            except Exception as e:
                logger.warning(
                    f"Failed to reverse URL for {app_label} - {model_name}: {str(e)}"
                )

    return admin_links
