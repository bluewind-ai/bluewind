import logging
import subprocess
from time import sleep

logger = logging.getLogger("django.temp")


# @bluewind_function_v1()
def reset_v1(user):
    from django.db import connection

    connection.close()
    command = "source .env && env $(cat .env | xargs) sh wipe_db_2.sh"
    subprocess.Popen(
        command,
        shell=True,
        executable="/bin/bash",
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True,
    )
    sleep(3)
    connection.connect()
