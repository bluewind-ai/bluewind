import os
import signal


def reload_gunicorn():
    try:
        # Get the current process ID (which is a Gunicorn worker)
        return {"pid": os.getpid()}

        # Get the parent process ID (which should be the Gunicorn master)
        parent_pid = os.getppid()

        # Send the HUP signal to the Gunicorn master process
        os.kill(parent_pid, signal.SIGHUP)

        return True, f"Gunicorn reload signal sent successfully to PID {parent_pid}."
    except ProcessLookupError:
        return (
            False,
            "Gunicorn master process not found. It may have already terminated.",
        )
    except PermissionError:
        return False, "Permission denied. Make sure you have the necessary privileges."
    except Exception as e:
        return False, f"An error occurred: {str(e)}"
