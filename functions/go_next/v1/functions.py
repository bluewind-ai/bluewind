import logging

from django.shortcuts import redirect

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


def snake_to_camel_case_uppercase(snake_str):
    components = snake_str.split("_")
    return "".join(x.capitalize() for x in components)


def go_next_v1():
    return redirect("/workspaces/2/admin/function_calls/functioncall/1/change")
    # function_call = FunctionCall.objects.filter(
    #     status=FunctionCall.Status.COMPLETED_READY_FOR_APPROVAL
    # ).first()

    # if function_call:
    #     return redirect(
    #         f"/workspaces/2/admin/function_calls/functioncall/{function_call.id}/change"
    #     )

    # function_call = FunctionCall.objects.filter(
    #     status=FunctionCall.Status.READY_FOR_APPROVAL
    # ).first()
    # if function_call:
    #     if function_call.function.name == "create_domain_name_v1":
    #         return redirect(
    #             f"/workspaces/2/admin/domain_names/domainname/add/?function_call={function_call.id}"
    #         )
    #     return redirect(
    #         f"/workspaces/2/admin/function_calls/functioncall/{function_call.id}/change"
    #     )
    # # raise Exception("WE ARE DONE")
    # return restart_v1()
