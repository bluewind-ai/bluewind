import logging
import subprocess

logger = logging.getLogger("django.not_used")


def run_ruff():
    subprocess.run(["ruff", "check", "--fix", "."])
