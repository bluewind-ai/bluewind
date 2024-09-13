import logging
import os
import sys
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
            if (
                self.project_root in frame.filename
                and "site-packages" not in frame.filename
            ):
                relative_filename = os.path.relpath(frame.filename, self.project_root)
                clean_path = f"/bluewind/{relative_filename}"
                clean_tb.append(
                    traceback.FrameSummary(
                        filename=clean_path,
                        lineno=frame.lineno,
                        name=frame.name,
                        line=frame.line,
                    )
                )
        lines = ["Traceback (most recent call last):\n"]
        lines.extend(traceback.format_list(clean_tb))
        lines.extend(traceback.format_exception_only(type, value))
        return "".join(lines)


def get_logging_config(base_dir):
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "verbose": {
                "()": CleanTracebackFormatter,
                "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "verbose",
                "level": "DEBUG",
                "stream": sys.stdout,
            },
        },
        "loggers": {
            "django": {
                "handlers": ["console"],
                "level": "INFO",
                "propagate": False,
            },
            "django.server": {
                "handlers": ["console"],
                "level": "ERROR",  # Changed from INFO to ERROR
                "propagate": False,
            },
            "django.request": {
                "handlers": ["console"],
                "level": "ERROR",
                "propagate": False,
            },
            "django.db.backends": {
                "level": "DEBUG",
                "propagate": False,
            },
            "bluewind": {
                "handlers": ["console"],
                "level": "DEBUG",
                "propagate": False,
            },
        },
        "root": {
            "handlers": ["console"],
            "level": "INFO",
        },
    }
