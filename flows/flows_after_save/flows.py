import logging
import os
import shutil

from django.conf import settings

logger = logging.getLogger("django.temp")


import logging

logger = logging.getLogger("django.temp")


def to_pascal_case(snake_str):
    return "".join(x.capitalize() for x in snake_str.split("_"))


import logging

logger = logging.getLogger("django.debug")


import logging

logger = logging.getLogger("django.debug")


def to_pascal_case(snake_str):
    return "".join(x.capitalize() for x in snake_str.split("_"))


def flows_after_save(flow):
    logger.debug(f"flows_after_save called for flow: {flow.name}")

    base_dir = os.path.abspath(settings.BASE_DIR)
    source_folder = os.path.abspath(os.path.join(base_dir, "flows", "flow_boilerplate"))
    destination_folder = os.path.abspath(os.path.join(base_dir, "flows", flow.name))

    logger.debug(f"Base directory: {base_dir}")
    logger.debug(f"Full source folder path: {source_folder}")
    logger.debug(f"Full destination folder path: {destination_folder}")

    flow_pascal_case = to_pascal_case(flow.name)

    try:
        if not os.path.exists(destination_folder):
            shutil.copytree(source_folder, destination_folder)
            logger.info(f"Successfully copied flow boilerplate to {destination_folder}")

            # Rename files and directories
            for root, dirs, files in os.walk(destination_folder, topdown=False):
                for name in files + dirs:
                    old_path = os.path.join(root, name)
                    new_name = name.replace("flow_boilerplate", flow.name)
                    new_name = new_name.replace("FlowBoilerplate", flow_pascal_case)
                    new_path = os.path.join(root, new_name)

                    if old_path != new_path:
                        os.rename(old_path, new_path)
                        logger.debug(f"Renamed: {old_path} to {new_path}")

            # Update file contents
            for root, _, files in os.walk(destination_folder):
                for file in files:
                    if file.endswith(".py"):  # Only process Python files
                        file_path = os.path.join(root, file)
                        with open(file_path, "r") as f:
                            content = f.read()

                        content = content.replace("flow_boilerplate", flow.name)
                        content = content.replace("FlowBoilerplate", flow_pascal_case)

                        with open(file_path, "w") as f:
                            f.write(content)
                        logger.debug(f"Updated content in: {file_path}")

            logger.info(
                f"Successfully renamed and updated content for flow: {flow.name}"
            )
        else:
            logger.warning(
                f"Folder {destination_folder} already exists. Skipping copy operation."
            )
    except Exception as e:
        logger.error(f"Error processing flow boilerplate: {str(e)}")

    return {}
