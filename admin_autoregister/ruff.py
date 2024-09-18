import logging
import subprocess

logger = logging.getLogger("django.temp")


def run_ruff():
    subprocess.run(["ruff", "check", "--fix", "."])
