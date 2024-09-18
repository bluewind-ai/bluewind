import logging
import subprocess

logger = logging.getLogger("django.temp")


def run_autopep8():
    try:
        result = subprocess.run(
            ["autopep8", "."], capture_output=True, text=True, check=True
        )
        logger.info("autopep8 ran successfully")
        return result.stdout
    except subprocess.CalledProcessError as e:
        logger.error(f"autopep8 failed with error: {e.stderr}")
        raise
