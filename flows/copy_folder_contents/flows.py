import logging

# Patch standard library
logger = logging.getLogger("django.temp")  # noqa: F821


import os
import shutil


def copy_folder_contents(flow_run, source_folder, destination_folder):
    # Create the destination folder if it doesn't exist
    if not os.path.exists(destination_folder):
        os.makedirs(destination_folder)

    # Iterate through all items in the source folder
    for item in os.listdir(source_folder):
        source_path = os.path.join(source_folder, item)
        destination_path = os.path.join(destination_folder, item)

        # If it's a file, copy it
        if os.path.isfile(source_path):
            shutil.copy2(source_path, destination_path)
        # If it's a directory, copy it recursively
        elif os.path.isdir(source_path):
            shutil.copytree(source_path, destination_path)


# Example usage:
# copy_folder_contents('/path/to/source/folder', '/path/to/destination/folder')
