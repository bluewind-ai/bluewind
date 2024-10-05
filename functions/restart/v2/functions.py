import logging
import subprocess
from time import sleep

from django.db import transaction

from functions.master.v1.functions import master_v1

logger = logging.getLogger("django.not_used")


def restart_v2():
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

    with transaction.atomic(savepoint=True):
        master_v1()
