import logging
import os
import shutil

logger = logging.getLogger("django.temp")  # noqa: F821


def create_flow_from_boilerplate(flow_run, flow_name, flow_to_clone):
    def copy_folder_contents(source_folder, destination_folder):
        os.makedirs(destination_folder)

        for item in os.listdir(source_folder):
            source_path = os.path.join(source_folder, item)
            destination_path = os.path.join(destination_folder, item)

            if os.path.isfile(source_path):
                shutil.copy2(source_path, destination_path)
            elif os.path.isdir(source_path):
                shutil.copytree(source_path, destination_path)

    base_dir = "flows"
    source_dir = os.path.join(
        base_dir, flow_to_clone.name
    )  # Use flow_to_clone.name instead of flow_to_clone
    destination_dir = os.path.join(base_dir, flow_name)

    copy_folder_contents(source_dir, destination_dir)

    logger.info(
        f"Created new flow '{flow_name}' from boilerplate '{flow_to_clone.name}'"
    )


# The rest of the code remains unchanged
