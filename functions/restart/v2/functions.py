import logging
import subprocess
from time import sleep

from function_calls.models import FunctionCall
from functions.approve_function_call.v2.functions import approve_function_call_v2
from functions.go_next.v1.functions import go_next_v1
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
    sleep(5)
    connection.connect()

    master_v1()
    function_call_id, _ = go_next_v1()
    function_call = FunctionCall.objects.get(pk=function_call_id)
    approve_function_call_v2(function_call)

    function_call_id, _ = go_next_v1()
    function_call = FunctionCall.objects.get(pk=function_call_id)
    approve_function_call_v2(function_call)

    function_call_id, _ = go_next_v1()
    function_call = FunctionCall.objects.get(pk=function_call_id)
    approve_function_call_v2(function_call)

    function_call_id, _ = go_next_v1()
    function_call = FunctionCall.objects.get(pk=function_call_id)
    approve_function_call_v2(function_call)

    function_call_id, _ = go_next_v1()
    function_call = FunctionCall.objects.get(pk=function_call_id)
    approve_function_call_v2(function_call)

    function_call_id, _ = go_next_v1()
    function_call = FunctionCall.objects.get(pk=function_call_id)
    approve_function_call_v2(function_call)

    function_call_id, _ = go_next_v1()
    function_call = FunctionCall.objects.get(pk=function_call_id)
    approve_function_call_v2(function_call)

    function_call_id, _ = go_next_v1()
    function_call = FunctionCall.objects.get(pk=function_call_id)
    approve_function_call_v2(function_call)

    function_call_id, _ = go_next_v1()
    function_call = FunctionCall.objects.get(pk=function_call_id)
    approve_function_call_v2(function_call)

    function_call_id, _ = go_next_v1()
    function_call = FunctionCall.objects.get(pk=function_call_id)
    approve_function_call_v2(function_call)

    function_call_id, _ = go_next_v1()
    function_call = FunctionCall.objects.get(pk=function_call_id)
    approve_function_call_v2(function_call)

    function_call_id, _ = go_next_v1()

    function_call = FunctionCall.objects.get(pk=function_call_id)

    approve_function_call_v2(function_call)
