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
    LOG_DIR = os.path.join(base_dir, "logs")
    os.makedirs(LOG_DIR, exist_ok=True)

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
            "file": {
                "level": "DEBUG",
                "class": "logging.handlers.RotatingFileHandler",
                "filename": os.path.join(LOG_DIR, "django.log"),
                "maxBytes": 1024 * 1024 * 5,  # 5 MB
                "backupCount": 5,
                "formatter": "verbose",
            },
        },
        "loggers": {
            "django": {
                "handlers": ["console", "file"],
                "level": "INFO",
                "propagate": False,
            },
            "django.server": {
                "handlers": ["console", "file"],
                "level": "INFO",
                "propagate": False,
            },
            "django.request": {
                "handlers": ["console", "file"],
                "level": "ERROR",
                "propagate": False,
            },
            "django.db.backends": {
                "handlers": ["file"],
                "level": "DEBUG",
                "propagate": False,
            },
            "bluewind": {
                "handlers": ["console", "file"],
                "level": "DEBUG",
                "propagate": False,
            },
        },
        "root": {
            "handlers": ["console", "file"],
            "level": "INFO",
        },
    }
