import logging
import subprocess

logger = logging.getLogger("django.debug")


def run_ruff():
    subprocess.run(["ruff", "check", "--fix", "."])
