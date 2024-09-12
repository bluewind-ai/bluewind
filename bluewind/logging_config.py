# bluewind/logging_config.py

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


class NonStaticHandler(logging.StreamHandler):
    def emit(self, record):
        if hasattr(record, "msg") and isinstance(record.msg, str):
            formatted_message = self.format(record)
            if not (
                '"GET /static/' in formatted_message
                or '"GET /favicon.ico' in formatted_message
            ):
                super().emit(record)
        else:
            super().emit(record)


class DatabaseLogHandler(logging.Handler):
    def emit(self, record):
        if record.name == "django.db.backends":
            try:
                sql = record.sql.strip()
                params = str(record.params)
                execution_time = getattr(record, "duration", None)
                database_alias = getattr(record, "alias", "default")

                # QueryLog.objects.create(
                #     timestamp=timezone.now(),
                #     logger_name=record.name,
                #     level=record.levelname,
                #     sql=sql,
                #     params=params,
                #     execution_time=execution_time,
                #     database_alias=database_alias,
                # )
            except Exception as e:
                print(f"Error saving query log: {e}")


def get_logging_config(base_dir):
    # Ensure the log directory exists
    LOG_DIR = os.path.join(base_dir, "logs")
    os.makedirs(LOG_DIR, exist_ok=True)

    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "simple": {"format": "%(levelname)s %(message)s"},
            "verbose": {"format": "%(asctime)s %(name)s [%(levelname)s] %(message)s"},
        },
        "handlers": {
            "console": {
                "class": "bluewind.logging_config.NonStaticHandler",
                "formatter": "simple",
                "level": "DEBUG",
                "stream": sys.stdout,
            },
            "db_file": {
                "class": "logging.FileHandler",
                "filename": os.path.join(LOG_DIR, "db_queries.log"),
                "formatter": "verbose",
                "level": "DEBUG",
            },
            "db_model": {
                "class": "bluewind.logging_config.DatabaseLogHandler",
                "level": "DEBUG",
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
                "level": "INFO",
                "propagate": False,
            },
            "django.db.backends": {
                "handlers": ["db_file", "db_model"],
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
