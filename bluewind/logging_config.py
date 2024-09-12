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
        "verbose": {
            "format": "%(levelname)s %(asctime)s %(module)s %(process)d %(thread)d %(message)s"
        },
        "simple": {"format": "%(levelname)s %(message)s"},
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
            "level": "DEBUG",
        },
        "file": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
            "level": "DEBUG",
        },
    },
    "loggers": {
        "django": {
            "handlers": ["console", "file"],
            "level": "INFO",
            "propagate": True,
        },
        "django.request": {
            "handlers": ["console", "file"],
            "level": "DEBUG",
            "propagate": True,
        },
        "bluewind": {
            "handlers": ["console", "file"],
            "level": "DEBUG",
            "propagate": True,
        },
    },
    "root": {
        "handlers": ["console", "file"],
        "level": "INFO",
    },
}
