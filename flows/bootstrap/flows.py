import logging

import gevent

from bluewind.context_variables import get_workspace_id
from flow_runs.models import FlowRun
from flows.bootstrap_workspace.flows import bootstrap_workspace
from flows.centralize_logs.flows import centralize_logs
from flows.create_daphne_process_in_db.flows import create_daphne_process_in_db
from flows.models import Flow
from flows.run_linters.flows import run_linters
from users.models import User

logger = logging.getLogger("django.not_used")


def bootstrap():
    logger.debug("Bootstrapping workspace.")
    create_daphne_process_in_db()
    run_linters()
    bootstrap_workspace()
    gevent.spawn(centralize_logs)

    FlowRun.objects.create(
        user=User.objects.get(id=1),
        workspace_id=get_workspace_id(),
        input_data={},
        flow=Flow.objects.get(name="deliver_value"),
        # parent_flow_run=None,
        status=FlowRun.Status.READY_FOR_APPROVAL,
    )
