import os
import sys
import traceback
from pathlib import Path

from colorlog import ColoredFormatter
from django.conf import settings

from bluewind.context_variables import (
    get_log_records,
    get_request_id,
    request_id_var,
)

BASE_DIR = Path(__file__).resolve().parent.parent
os.environ["BASE_DIR"] = str(BASE_DIR)


class CleanTracebackFormatter(ColoredFormatter):
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
                and "custom_exception.py" not in frame.filename
                and "wrapper" not in frame.name
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

        # Add explicit color codes
        RED = "\033[31m"
        YELLOW = "\033[33m"
        CYAN = "\033[36m"
        RESET = "\033[0m"

        lines = [f"{RED}Traceback (most recent call last):{RESET}\n"]
        for frame in clean_tb:
            lines.append(
                f'{YELLOW}  File "{frame.filename}", line {frame.lineno}, in {frame.name}{RESET}\n'
            )
            if frame.line:
                lines.append(f"{CYAN}    {frame.line.strip()}{RESET}\n")
        lines.extend(traceback.format_exception_only(type, value))
        return "".join(lines)


class CombinedFormatter(CleanTracebackFormatter):
    def clean_pathname(self, pathname):
        return pathname.replace("/bluewind/bluewind/", "")

    def format(self, record):
        if request_id_var.get(None) is None:
            record.request_id = "no_request_id"
            return super().format(record)
        record.request_id = get_request_id()
        formatted_record = super().format(record)

        if record.exc_info:
            record.exc_text = self.formatException(record.exc_info)
            formatted_record += f"\n{record.exc_text}"

        log_entry = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "request_id": record.request_id,
            "logger": record.name,
            "message": record.getMessage(),
        }
        log_records = get_log_records()
        log_records.append(log_entry)

        return formatted_record


def get_logging_config():
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "colored": {
                "()": CombinedFormatter,
                "format": "%(log_color)s%(asctime)s [%(levelname)s] [%(request_id)s] %(name)s: %(message)s (%(pathname)s:%(lineno)d)",
                "log_colors": {
                    "DEBUG": "cyan",
                    "INFO": "green",
                    "WARNING": "yellow",
                    "ERROR": "red",
                    "CRITICAL": "red,bg_white",
                },
                "secondary_log_colors": {},
                "style": "%",
            },
            "simple": {
                "format": "[{levelname}] {asctime} {module} {message}",
                "style": "{",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "colored",
                "stream": sys.stdout,
            },
            "file": {
                "class": "logging.FileHandler",
                "filename": os.path.join(BASE_DIR, "logs", "app.log"),
                "formatter": "simple",
            },
        },
        "loggers": {
            "django": {
                "handlers": ["console"],
                "level": "ERROR",
                "propagate": False,
            },
            "django.utils.autoreload": {
                "level": "ERROR",
                "propagate": False,
            },
            "django.db.backends": {
                "level": "ERROR",
                "handlers": ["console"],
                "propagate": False,
            },
            "django.static": {
                "level": "ERROR",
                "handlers": ["console"],
                "propagate": False,
            },
            "django.db.backends.schema": {
                "level": "ERROR",
                "handlers": ["console"],
                "propagate": False,
            },
            "django.temp": {
                "handlers": ["console"],
                "level": "DEBUG",
                "propagate": False,
            },
            "django.watchdog": {
                "handlers": ["console"],
                "level": "ERROR",
                "propagate": False,
            },
            "django.geventpool": {
                "handlers": ["console"],
                "level": "ERROR",
                "propagate": False,
            },
            "django.gunicorn": {
                "handlers": ["console"],
                "level": "ERROR",
                "propagate": False,
            },
            "django.request": {
                "handlers": ["console"],
                "level": "DEBUG",
                "propagate": False,
            },
            "django.always_used": {
                "handlers": ["console"],
                "level": "ERROR",
                "propagate": False,
            },
            "django.to_file": {
                "handlers": ["file"],
                "level": "DEBUG",
                "propagate": False,
            },
        },
        "root": {
            "handlers": ["console"],
            "level": "ERROR",
        },
    }
