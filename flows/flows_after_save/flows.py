import logging
import os
import shutil

from django.conf import settings

logger = logging.getLogger("django.debug")


def flows_after_save(flow):
    logger.debug(f"flows_after_save called for flow: {flow.name}")

    base_dir = os.path.abspath(settings.BASE_DIR)
    source_folder = os.path.abspath(os.path.join(base_dir, "flows", "flow_boilerplate"))
    destination_folder = os.path.abspath(os.path.join(base_dir, "flows", flow.name))

    logger.debug(f"Base directory: {base_dir}")
    logger.debug(f"Full source folder path: {source_folder}")
    logger.debug(f"Full destination folder path: {destination_folder}")

    try:
        if not os.path.exists(destination_folder):
            shutil.copytree(source_folder, destination_folder)
            logger.info(
                f"Successfully copied and renamed flow boilerplate to {destination_folder}"
            )
        else:
            logger.warning(
                f"Folder {destination_folder} already exists. Skipping copy operation."
            )
    except Exception as e:
        logger.error(f"Error copying flow boilerplate: {str(e)}")

    return {}
