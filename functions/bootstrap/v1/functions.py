import logging

from flows.bootstrap_workspace.flows import bootstrap_workspace
from flows.run_linters.flows import run_linters

logger = logging.getLogger("django.not_used")


def bootstrap():
    logger.debug("Bootstrapping workspace.")
    run_linters()
    bootstrap_workspace()

    # gevent.spawn(centralize_logs)

    # FlowRun.objects.create(
    #     user=User.objects.get(id=1),
    #     workspace_id=get_workspace_id(),
    #     input_data={},
    #     flow=Flow.objects.get(name="deliver_value"),
    #     # parent_flow_run=None,
    #     status=FlowRun.Status.READY_FOR_APPROVAL,
    # )
