import os

from gunicorn_instances.models import GunicornInstance


def create_gunicorn_instance_in_db():
    ppid = os.getppid()
    gunicorn_instance = GunicornInstance.objects.filter(
        master_pid=ppid,
    ).first()
    if not gunicorn_instance:
        GunicornInstance.objects.create(
            master_pid=ppid, status=GunicornInstance.Status.RUNNING
        )
