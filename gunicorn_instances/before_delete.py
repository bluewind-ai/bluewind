import logging

import psutil

logger = logging.getLogger("django.temp")


logger = logging.getLogger("django.temp")


logger = logging.getLogger("django.temp")


def gunicorn_instance_before_delete(instance):
    logger.info("Starting gunicorn_instance_before_delete function")
    logger.info(f"Instance ID: {instance.id}")
    logger.info(f"Master process ID: {instance.master_pid}")

    master_process = psutil.Process(instance.master_pid)
    logger.info(f"Master process found: {master_process}")

    logger.info("Attempting to terminate master process")
    master_process.terminate()
    logger.info("Master process terminated successfully")

    logger.info("Exiting gunicorn_instance_before_delete function")
    return instance
