import logging

from django.forms import model_to_dict

logger = logging.getLogger("django.temp")


def handle_network_calls_v1(func, kwargs, function_call):
    data = model_to_dict(kwargs["domain_name"])
    del data["id"]
    del data["workspace"]
    del data["user"]
    del data["user"]
    raise Exception(
        model_to_dict(kwargs["domain_name"]),
    )
    return func(**kwargs)
