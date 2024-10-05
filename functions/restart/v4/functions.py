import logging
import subprocess
from time import sleep

from function_calls.models import FunctionCall
from functions.replay_until_here.v1.functions import replay_until_here_v1

logger = logging.getLogger("django.not_used")


def restart_v4(object_id):
    if not object_id:
        function_name_to_reach = "unreachable_function"
    else:
        function_name_to_reach = FunctionCall.objects.get(pk=object_id).function.name
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

    replay_until_here_v1(function_name_to_reach)
