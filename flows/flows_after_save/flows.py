import logging

logger = logging.getLogger("django.debug")


import logging
import os
import shutil

from django.conf import settings

logger = logging.getLogger("django.debug")


def flows_after_save(flow):
    source_folder = os.path.join(settings.BASE_DIR, "flows", "flow_boilerplate")
    destination_folder = os.path.join(settings.BASE_DIR, "flows", flow.name)

    try:
        if not os.path.exists(destination_folder):
            shutil.copytree(source_folder, destination_folder)
            logger.info(
                f"Successfully copied and renamed flow boilerplate to {flow.name}"
            )
        else:
            logger.warning(
                f"Folder {flow.name} already exists. Skipping copy operation."
            )
    except Exception as e:
        logger.error(f"Error copying flow boilerplate: {str(e)}")

    return {}
