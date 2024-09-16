import logging

logger = logging.getLogger("django.debug")


def flows_update_after_file_changes(file_change):
    logger.debug(f"Updating flows after file change: {file_change}")
    pass
