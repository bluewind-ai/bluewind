import logging
import sys

import gevent

from bluewind.settings_prod import LOG_FILE_PATH

# Patch standard library
logger = logging.getLogger("django.temp")


def centralize_logs():
    logger.info("Starting centralize_logs function")
    try:
        with open(LOG_FILE_PATH, "r") as log_file:
            log_file.seek(0, 2)
            logger.info(f"Opened log file: {LOG_FILE_PATH}")
            while True:
                line = log_file.readline()
                if not line:
                    gevent.sleep(0.1)
                    continue
                "cdscds"
                # cleaned_line = clean_log_entry(line)
                sys.stdout.write(line)
                sys.stdout.flush()
    except FileNotFoundError:
        logger.error(f"Log file not found: {LOG_FILE_PATH}")
    except IOError as e:
        logger.error(f"Error reading log file: {e}")
