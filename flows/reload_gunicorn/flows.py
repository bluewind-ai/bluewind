import os
import signal


def reload_gunicorn(gunicorn_instance):
    # Get the parent process ID (Gunicorn master)

    ppid = os.getppid()

    # Send SIGHUP signal to the Gunicorn master process
    os.kill(ppid, signal.SIGHUP)

    return {"message": f"Sent reload signal to Gunicorn master process (PID: {ppid})"}
