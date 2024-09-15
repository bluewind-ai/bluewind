from flows.flows.file_watchers_init import file_watchers_init
from flows.flows.files_load_all import files_load_all


def bootstrap():
    files_load_all()
    file_watchers_init()
