import os
import signal


def gunicorn_instance_before_delete(instance):
    ppid = os.getppid()

    # Send SIGHUP signal to the Gunicorn master process
    os.kill(ppid, signal.SIGTERM)

    return {"message": f"Sent reload signal to Gunicorn master process (PID: {ppid})"}
