import os

from gunicorn_instances.models import GunicornInstance


def create_gunicorn_instance_from_pid():
    # Get the parent process ID (Gunicorn master)
    pid = os.getppid()

    # Create and save the GunicornInstance
    instance = GunicornInstance(master_pid=pid, status=GunicornInstance.Status.RUNNING)
    instance.save()

    return {
        "message": f"Created GunicornInstance with PID: {pid}",
        "instance": instance,
    }
