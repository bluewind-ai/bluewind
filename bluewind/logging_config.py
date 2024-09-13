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
                clean_path = f"/{relative_filename}"
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


from .request_id_middleware import log_records_var, request_id_var


class ContextAwareRequestIDFormatter(logging.Formatter):
    def format(self, record):
        # Attach request ID from context
        record.request_id = request_id_var.get() or "no_request_id"
        formatted_record = super().format(record)
        self.append_to_app_log(record)
        return formatted_record

    def append_to_app_log(self, record):
        log_entry = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "request_id": record.request_id,
            "logger": record.name,
            "message": record.getMessage(),
        }
        log_records = log_records_var.get()
        if log_records is not None:
            log_records.append(log_entry)


class CombinedFormatter(CleanTracebackFormatter, ContextAwareRequestIDFormatter):
    def format(self, record):
        # First, attach the request ID using ContextAwareRequestIDFormatter
        record.request_id = request_id_var.get() or "no_request_id"
        formatted_record = super().format(record)

        # Apply the custom traceback formatting from CleanTracebackFormatter
        if record.exc_info:
            record.exc_text = self.formatException(record.exc_info)
            # Ensure that the formatted traceback is added to the message
            formatted_record += f"\n{record.exc_text}"

        self.append_to_app_log(record)
        return formatted_record


def get_logging_config(base_dir):
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "verbose": {
                "()": CombinedFormatter,
                "format": "%(asctime)s [%(levelname)s] [%(request_id)s] %(name)s: %(message)s",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "verbose",
                "level": "DEBUG",
                "stream": sys.stdout,
            },
            "null": {  # Define the null handler
                "class": "logging.NullHandler",
            },
        },
        "loggers": {
            "django": {
                "handlers": ["console"],
                "level": "INFO",
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
            "django.server": {
                "handlers": ["null"],
                "level": "CRITICAL",
                "propagate": False,
            },
        },
        "root": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    }
