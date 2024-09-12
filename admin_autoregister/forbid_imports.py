import logging
import os

from django.conf import settings

logger = logging.getLogger(__name__)


def check_forbidden_imports():
    forbidden_import = "from django.contrib.auth.models import User"
    checker_file = os.path.abspath(__file__)  # Get the full path of this file

    for app, app_type in settings.APP_TYPE.items():
        if app_type == "custom":
            app_path = os.path.join(settings.BASE_DIR, app.replace(".", os.path.sep))
            if os.path.isdir(app_path):
                for root, dirs, files in os.walk(app_path):
                    for file in files:
                        if file.endswith(".py"):
                            file_path = os.path.join(root, file)
                            if file_path == checker_file:
                                continue  # Skip the checker file itself
                            with open(file_path, "r") as f:
                                content = f.read()
                                if forbidden_import in content:
                                    logger.error(
                                        f"Forbidden import found in {file_path}"
                                    )
                                    raise ImportError(
                                        f"Forbidden import 'from django.contrib.auth.models import User' found in {file_path}"
                                    )

    logger.info("No forbidden imports found.")


# Run the check
check_forbidden_imports()
