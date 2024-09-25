import logging
import os

import gevent
from django.contrib.auth import get_user_model

from bluewind.context_variables import get_workspace_id
from file_watchers.models import FileWatcher

User = get_user_model()
logger = logging.getLogger("django.not_used")


def file_watchers_init(flow_run):
    # Fetch the first FileWatcher instance or create a new one if none exists
    def delegate():
        FileWatcher.objects.create(
            path=os.environ["BASE_DIR"],
            user_id=1,
            workspace_id=get_workspace_id(),
            status=FileWatcher.Status.RUNNING,
        )

    gevent.spawn(delegate)

    flow_run.status = flow_run.Status.COMPLETED
