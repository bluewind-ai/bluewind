import logging
import os

logger = logging.getLogger("django.debug")


def check_flow_compliance():
    flows_dir = "flows"

    for folder_name in os.listdir(flows_dir):
        folder_path = os.path.join(flows_dir, folder_name)

        if os.path.isdir(folder_path):
            files_to_check = ["flows.py", "input_forms.py", "output_forms.py"]

            for file_name in files_to_check:
                file_path = os.path.join(folder_path, file_name)

                if not os.path.isfile(file_path):
                    logger.error(f"bluewind/{file_path} (missing)")
