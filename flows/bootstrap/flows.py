import logging

from flows.bootstrap_workspace.flows import bootstrap_workspace
from flows.create_daphne_process_in_db.flows import create_daphne_process_in_db

logger = logging.getLogger("django.not_used")


def sync_bootstrap():
    bootstrap()


def bootstrap():
    logger.debug("Bootstrapping workspace.")
    create_daphne_process_in_db()
    # run_linters()
    bootstrap_workspace()


"csdcds"
