import logging
import subprocess
from time import sleep

from functions.replay_until_here.v1.functions import replay_until_here_v1

logger = logging.getLogger("django.not_used")


def restart_v4(object_id):
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
    sleep(5)
    connection.connect()
    replay_until_here_v1(object_id)
