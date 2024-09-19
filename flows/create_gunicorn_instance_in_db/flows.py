import os

from gunicorn_instances.models import GunicornInstance


def create_gunicorn_instance_in_db():
    pid = os.getpid()
    gunicorn_instance = GunicornInstance.objects.filter(
        master_pid=pid,
    ).first()
    if not gunicorn_instance:
        GunicornInstance.objects.create(
            master_pid=pid, status=GunicornInstance.Status.RUNNING
        )
