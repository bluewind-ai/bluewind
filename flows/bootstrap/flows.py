import logging

from flows.file_watchers_init.flows import file_watchers_init
from flows.files_load_all.flows import files_load_all

logger = logging.getLogger("django.debug")


def bootstrap():
    files_load_all()
    file_watchers_init()
