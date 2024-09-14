import logging
import os
import sys
import traceback

from django.conf import settings

from bluewind.context_variables import log_records_var, request_id_var


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


class CombinedFormatter(CleanTracebackFormatter):
    def format(self, record):
        # First, attach the request ID using ContextAwareRequestIDFormatter
        if request_id_var.get(None) is None:
            record.request_id = "no_request_id"
            return super().format(record)
        record.request_id = request_id_var.get()
        formatted_record = super().format(record)

        # Apply the custom traceback formatting from CleanTracebackFormatter
        if record.exc_info:
            record.exc_text = self.formatException(record.exc_info)
            # Ensure that the formatted traceback is added to the message
            formatted_record += f"\n{record.exc_text}"

        log_entry = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "request_id": record.request_id,
            "logger": record.name,
            "message": record.getMessage(),
        }
        log_records = log_records_var.get()
        with open("logs/logging.log", "a") as f:
            f.write(str(log_entry) + "/n")
        log_records.append(log_entry)

        # with open("logs/log_records_var.log", "a") as f:
        #     f.write(str(log_records_var.get()) + "/n")

        return formatted_record


def get_logging_config(base_dir):
    logs_dir = os.path.join(base_dir, "logs")
    os.makedirs(logs_dir, exist_ok=True)

    log_file_path = os.path.join(logs_dir, "all_logs.log")

    return {
        "version": 1,
        "disable_existing_loggers": True,
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
                "stream": sys.stdout,
            },
            "file": {  # Define the file handler
                "class": "logging.FileHandler",
                "formatter": "verbose",
                "filename": log_file_path,  # Path to the log file
            },
        },
        "loggers": {
            "django": {
                "handlers": ["console"],
                "level": "DEBUG",  # Set to WARNING or ERROR to suppress DEBUG logs                "propagate": True,
            },
            "django.utils.autoreload": {
                "level": "DEBUG",  # Set to WARNING or ERROR to suppress DEBUG logs                "handlers": ["console", "file"],
                "propagate": False,
            },
            "django.db.backend": {
                "level": "DEBUG",  # Set to WARNING or ERROR to suppress DEBUG logs                "handlers": ["console", "file"],
                "propagate": False,
                "handlers": ["console"],
            },
            "django.temp": {
                "level": "DEBUG",  # Set to WARNING or ERROR to suppress DEBUG logs
                "handlers": ["console"],
                "propagate": False,
            },
        },
    }
