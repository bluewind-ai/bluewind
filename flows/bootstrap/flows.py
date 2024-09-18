import logging

from admin_autoregister.admin_inheritance import check_admin_inheritance
from admin_autoregister.autopep8 import run_autopep8
from admin_autoregister.check_unique_together import check_unique_constraints
from admin_autoregister.clean_dockerignore import clean_dockerignore
from admin_autoregister.forbid_imports import check_forbidden_imports
from admin_autoregister.ruff import run_ruff
from flows.file_watchers_init.flows import file_watchers_init
from flows.files_load_all.flows import files_load_all

logger = logging.getLogger("django.debug")


def bootstrap():
    files_load_all()
    file_watchers_init()
    run_ruff()
    run_autopep8()
    clean_dockerignore()
    check_admin_inheritance()
    check_forbidden_imports()
    check_unique_constraints()
    # check_and_fix_model_save_method()
    # check_flow_compliance()
