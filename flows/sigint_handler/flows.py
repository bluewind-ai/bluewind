import os
import sys
import traceback

from django.db import connection
from django.utils import timezone

from manage import load_env  # noqa


def sigint_handler():
    from gunicorn_instances.models import GunicornInstance

    print(f"[{timezone.now()}] Received SIGINT. Performing cleanup...")
    current_pid = os.getpid()

    try:
        print(f"Current process ID: {current_pid}")
        print(f"Parent process ID: {os.getppid()}")

        # Get all running instances
        running_instances = GunicornInstance.objects.filter(
            status=GunicornInstance.Status.RUNNING
        )
        print(f"Total running instances before cleanup: {running_instances.count()}")

        # Update the specific GunicornInstance matching the current PID
        updated_count = GunicornInstance.objects.filter(
            status=GunicornInstance.Status.RUNNING, master_pid=current_pid
        ).update(status=GunicornInstance.Status.TERMINATED)

        print(f"Updated {updated_count} GunicornInstance(s) to TERMINATED status")

        # Check if the instance was actually updated
        instance = GunicornInstance.objects.filter(master_pid=current_pid).first()
        if instance:
            print(
                f"Instance details: ID={instance.id}, Status={instance.status}, Created={instance.created_at}"
            )
        else:
            print("No matching GunicornInstance found for the current PID")

        # Print current DB connection info
        print(f"Current DB connection: {connection.connection}")

        # Print environment variables
        print("Environment variables:")
        for key, value in os.environ.items():
            print(f"  {key}: {value}")

    except Exception as e:
        print(f"Error during cleanup: {str(e)}")
        print("Traceback:")
        traceback.print_exc()

    finally:
        print(f"[{timezone.now()}] Cleanup completed. Exiting.")
        connection.close()
        sys.exit(0)
