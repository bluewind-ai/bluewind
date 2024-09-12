import os


def get_logging_config(base_dir):
    LOG_DIR = os.path.join(base_dir, "logs")
    os.makedirs(LOG_DIR, exist_ok=True)

    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "verbose": {"format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s"},
        },
        "handlers": {
            "file": {
                "level": "DEBUG",
                "class": "logging.handlers.RotatingFileHandler",
                "filename": os.path.join(LOG_DIR, "db_queries.log"),
                "maxBytes": 1024 * 1024 * 5,  # 5 MB
                "backupCount": 5,
                "formatter": "verbose",
            },
        },
        "loggers": {
            "django.db.backends": {
                "handlers": ["file"],
                "level": "DEBUG",
                "propagate": False,
            },
        },
    }
