from admin_autoregister.admin_inheritance import check_admin_inheritance
from admin_autoregister.autopep8 import run_autopep8
from admin_autoregister.check_unique_together import check_unique_constraints
from admin_autoregister.clean_dockerignore import clean_dockerignore
from admin_autoregister.forbid_imports import check_forbidden_imports
from admin_autoregister.ruff import run_ruff


def run_linters():
    run_ruff()
    run_autopep8()
    clean_dockerignore()
    check_admin_inheritance()
    check_forbidden_imports()
    check_unique_constraints()
