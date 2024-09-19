import logging

from flows.bootstrap_workspace.flows import bootstrap_workspace
from flows.create_daphne_process_in_db.flows import create_daphne_process_in_db
from flows.run_linters.flows import run_linters

logger = logging.getLogger("django.debug")


def bootstrap():
    create_daphne_process_in_db()
    run_linters()
    bootstrap_workspace()
