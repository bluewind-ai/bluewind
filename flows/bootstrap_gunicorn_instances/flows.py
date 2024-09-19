import os

from gunicorn_instances.models import GunicornInstance


def bootstrap_gunicorn_instance():
    ppid = os.getppid()
    if GunicornInstance.objects.filter(master_pid=ppid).update(
        bootstrap_status__in=[
            GunicornInstance.Status.PENDING,
            GunicornInstance.BootstrapStatus.DONE,
        ]
    ):
        return
    GunicornInstance.objects.filter(master_pid=ppid).update(
        workspace_status=GunicornInstance.BootstrapStatus.DONE
    )
