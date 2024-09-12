# bluewind/logging_config.py

import logging
import os
import traceback

from django.conf import settings


# Define a custom traceback formatter
class CleanTracebackFormatter(logging.Formatter):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.project_root = str(settings.BASE_DIR)

    def formatException(self, exc_info):
        type, value, tb = exc_info
        clean_tb = []
        for frame in traceback.extract_tb(tb):
            # Only modify the path if it's within the project directory
            if (
                self.project_root in frame.filename
                and "site-packages" not in frame.filename
            ):
                # Get the path relative to the project root
                relative_filename = os.path.relpath(frame.filename, self.project_root)
                # Ensure it starts with '/bluewind'
                clean_path = f"/bluewind/{relative_filename}"
                clean_tb.append(
                    traceback.FrameSummary(
                        filename=clean_path,  # Use the cleaned path
                        lineno=frame.lineno,
                        name=frame.name,
                        line=frame.line,
                    )
                )

        lines = ["Traceback (most recent call last):\n"]
        lines.extend(traceback.format_list(clean_tb))
        lines.extend(traceback.format_exception_only(type, value))
        return "".join(lines)


LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "clean": {
            "()": "bluewind.logging_config.CleanTracebackFormatter",  # Updated path
            "format": "%(levelname)s: %(message)s",
        },
        "default": {
            "format": "%(levelname)s: %(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "clean",
            "level": "ERROR",
        },
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
        "django.request": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
        "bluewind": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "ERROR",
    },
}
