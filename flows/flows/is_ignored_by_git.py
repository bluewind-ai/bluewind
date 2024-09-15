# utils/git_utils.py

import logging
import os
import subprocess

# Use the 'django.temp' logger for this utility
temp_logger = logging.getLogger("django.temp")


def is_ignored_by_git(file_path):
    """
    Check if the file is ignored by the .gitignore.
    :param file_path: The path to the file to check.
    :return: True if the file is ignored, False otherwise.
    """
    try:
        # Get the base directory from environment variables
        repo_path = os.environ.get("BASE_DIR")
        if not repo_path:
            temp_logger.error("BASE_DIR environment variable is not set.")
            return False

        temp_logger.debug(
            f"Checking if the file is ignored by git: {file_path} in repo {repo_path}"
        )

        # Run git check-ignore to see if the file is ignored
        result = subprocess.run(
            ["git", "check-ignore", file_path],
            capture_output=True,
            text=True,
            cwd=repo_path,  # Ensure the command is run in the correct directory
        )

        # Log the result of the git check-ignore command
        if result.returncode == 0:
            temp_logger.debug(f"File {file_path} is ignored by git.")
        else:
            temp_logger.debug(f"File {file_path} is not ignored by git.")

        # If the return code is 0, the file is ignored
        return result.returncode == 0
    except Exception as e:
        temp_logger.error(f"Error checking if file is gitignored: {e}")
        return False
