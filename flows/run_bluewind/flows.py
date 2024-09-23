import logging
import re
import sys

import gevent
from gevent import subprocess

from bluewind.settings_prod import LOG_FILE_PATH

# Patch standard library
logger = logging.getLogger("django.temp")


def run_bluewind():
    logger.info("Starting run_bluewind function")

    logger.info("Creating greenlets for centralize_logs and run_gunicorn")
    ran_gunicorn = False
    if not ran_gunicorn:
        run_gunicorn()
    centralize_logs()


def clean_log_entry(log_entry):
    pattern = r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3} \[.*?\] \[.*?\] .*?: "
    return re.sub(pattern, "", log_entry)


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
                # cleaned_line = clean_log_entry(line)
                sys.stdout.write(line)
                sys.stdout.flush()
    except FileNotFoundError:
        logger.error(f"Log file not found: {LOG_FILE_PATH}")
    except IOError as e:
        logger.error(f"Error reading log file: {e}")


def run_gunicorn():
    subprocess.run(["python", "manage.py", "rungunicorn"])
