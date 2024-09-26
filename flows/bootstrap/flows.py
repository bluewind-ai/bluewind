import logging

logger = logging.getLogger("django.not_used")


def bootstrap():
    pass
    # logger.debug("Bootstrapping workspace.")
    # create_daphne_process_in_db()
    # run_linters()
    # bootstrap_workspace()

    # gevent.spawn(centralize_logs)

    # FlowRun.objects.create(
    #     user=User.objects.get(id=1),
    #     workspace_id=get_workspace_id(),
    #     input_data={},
    #     flow=Flow.objects.get(name="deliver_value"),
    #     # parent_flow_run=None,
    #     status=FlowRun.Status.READY_FOR_APPROVAL,
    # )
