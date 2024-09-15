import logging

logger = logging.getLogger("django.not_used")


def file_changes_after_save(file_changes):
    logger.debug(f"Checking file change for: {file_changes.file_path}")

    if file_changes.file_path.endswith("models.py"):
        logger.debug(f"Detected change in models.py: {file_changes.file_path}")
        logger.debug("Handling models.py change logic...")

        # Example: Call a management command to make migrations
        from django.core.management import call_command

        try:
            logger.debug("Running makemigrations command...")
            call_command("makemigrations")
            logger.debug("Running migrate command...")
            call_command("migrate")
            logger.info("Successfully handled models.py changes.")
        except Exception as e:
            logger.error(f"Error handling models.py changes: {e}")
