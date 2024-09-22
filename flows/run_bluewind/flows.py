import logging
import sys

import gevent
from gevent import monkey, subprocess

from bluewind.settings_prod import LOG_FILE_PATH

# Patch standard library
monkey.patch_all()

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
                sys.stdout.write(line)
                sys.stdout.flush()
    except FileNotFoundError:
        logger.error(f"Log file not found: {LOG_FILE_PATH}")
    except IOError as e:
        logger.error(f"Error reading log file: {e}")


def run_gunicorn():
    logger.info("Starting run_gunicorn function")
    try:
        logger.info("Attempting to run gunicorn")
        result = subprocess.run(
            ["python", "manage.py", "rungunicorn", "--bind", "127.0.0.1:8080"],
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode != 0:
            logger.error(
                f"Gunicorn command failed with return code {result.returncode}"
            )
            logger.error(f"STDOUT: {result.stdout}")
            logger.error(f"STDERR: {result.stderr}")
        else:
            logger.info("Gunicorn command completed successfully")
        return result.stdout
    except Exception as e:
        logger.exception(f"An error occurred while running gunicorn: {e}")
        return None


def run_bluewind():
    logger.info("Starting run_bluewind function")

    logger.info("Creating greenlets for centralize_logs and run_gunicorn")
    log_greenlet = gevent.spawn(centralize_logs)
    gunicorn_greenlet = gevent.spawn(run_gunicorn)

    logger.info("Waiting for gunicorn process to finish")
    try:
        gunicorn_result = gunicorn_greenlet.get()
        logger.info("Gunicorn process finished")
    except Exception as e:
        logger.exception(f"Error while waiting for gunicorn to finish: {e}")
    finally:
        logger.info("Killing log_greenlet")
        log_greenlet.kill()

    logger.info("run_bluewind function completed")
    return gunicorn_result
