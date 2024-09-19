import logging

logger = logging.getLogger("django.temp")


def file_changes_after_create(file_change):
    logger.debug(
        f"FileChange ({file_change.change_type}) detected for {file_change.source_path}"
    )
    if file_change.change_type == "created":
        logger.debug(
            f"FileChange ({file_change.change_type}) detected for {file_change.source_path}"
        )


"cdscdccdsdss"
