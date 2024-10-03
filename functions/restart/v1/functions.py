import logging
import subprocess

from django.http import HttpResponseRedirect

logger = logging.getLogger("django.not_used")


def delayed_restart():
    command = "source .env && env $(cat .env | xargs) sh wipe_db.sh"
    subprocess.Popen(
        command,
        shell=True,
        executable="/bin/bash",
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True,
    )


def restart_v1():
    delayed_restart()
    response = HttpResponseRedirect("/")
    response.content = b'<html><body><script>setTimeout(function(){window.location.href="/"},3000);</script>Redirecting in 3 seconds...</body></html>'
    return response
