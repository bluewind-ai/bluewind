import logging
import subprocess

logger = logging.getLogger("django.not_used")


# @bluewind_function_v1()
def delayed_restart_v1():
    command = "source .env && env $(cat .env | xargs) sh wipe_db.sh"
    subprocess.Popen(
        command,
        shell=True,
        executable="/bin/bash",
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True,
    )
