import logging

logger = logging.getLogger("django.temp")


def file_changes_after_save(file_changes):
    if file_changes.file_path.endswith("models.py"):
        logger.debug(f"Detected change in models.py: {file_changes.file_path}")

        # Implement the logic you want to perform after models.py changes
        logger.debug("Handling models.py change logic...")
        # Example: Call a management command to make migrations
        from django.core.management import call_command

        try:
            call_command("makemigrations")
            call_command("migrate")
            logger.info("Successfully handled models.py changes.")
        except Exception as e:
            logger.error(f"Error handling models.py changes: {e}")
