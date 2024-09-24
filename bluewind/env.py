import os


def load_env():
    import logging

    logger = logging.getLogger("django.temp")
    """Load environment variables from .env file."""
    env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    if os.path.exists(env_file):
        with open(env_file, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    key, value = line.split("=", 1)
                    logger.debug(f"Setting {key}={value}")
                    os.environ[key] = value.strip("'").strip('"')
