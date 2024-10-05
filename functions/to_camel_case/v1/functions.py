import logging

logger = logging.getLogger("django.not_used")


import logging

logger = logging.getLogger("django.not_used")


import logging

logger = logging.getLogger("django.not_used")


def to_camel_case_v1(string):
    components = string.split("_")
    return "".join(x.title() for x in components)
