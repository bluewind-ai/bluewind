import logging

from flows.flows.is_ignored_by_git import is_ignored_by_git

logger = logging.getLogger("django.not_used")


def files_on_ready():
    # push all the files not gitignored into the database
    # you have access to  the method is_ignored_by_git(file_path
    is_ignored_by_git("cdcds")
    pass
