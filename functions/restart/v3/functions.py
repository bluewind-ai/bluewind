import logging
import subprocess
from time import sleep

from functions.approve_function_call.v2.functions import approve_function_call_v2
from functions.go_next.v2.functions import go_next_v2
from functions.handle_function_call_after_save.v1.functions import (
    handle_function_call_after_save_v1,
)
from functions.master.v1.functions import master_v1

logger = logging.getLogger("django.not_used")


def restart_v3(function_call_to_reach):
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

    function_call, user = master_v1()
    current_function_call, _, _ = go_next_v2(function_call, user)
    other_object_than_function_call = None
    function_call_to_reach = function_call_to_reach or None
    while current_function_call != function_call_to_reach:
        if other_object_than_function_call:
            other_object_than_function_call.save()
            handle_function_call_after_save_v1(other_object_than_function_call)
            other_object_than_function_call.function_call.refresh_from_db()
        else:
            approve_function_call_v2(function_call, user)
        current_function_call, _, other_object_than_function_call = go_next_v2(
            function_call=current_function_call, user=user
        )
