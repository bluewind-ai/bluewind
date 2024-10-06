import logging

from django.db import models
from django.db.models import F

from function_calls.models import FunctionCall
from functions.master.v1.functions import master_v1

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


def snake_to_camel_case_uppercase(snake_str):
    components = snake_str.split("_")
    return "".join(x.capitalize() for x in components)


from django.db.models import Case, Value, When


def go_next_v2(function_call, user, only_descendants_of=None):
    def get_ordered_queryset(statuses):
        return (
            FunctionCall.objects.filter(status__in=statuses)
            .annotate(
                parent_created_at=Case(
                    When(tn_parent__isnull=False, then=F("tn_parent__created_at")),
                    default=Value(None),
                    output_field=models.DateTimeField(),
                )
            )
            .order_by(F("parent_created_at").desc(nulls_last=True), "created_at")
        )

    if not user:
        function_call, user = master_v1()
        return go_next_v2(function_call=function_call, user=user)
    picked_function_call = None

    for function_call_item in get_ordered_queryset(
        [FunctionCall.Status.COMPLETED_READY_FOR_APPROVAL]
    ):
        if (
            only_descendants_of is None
            or function_call_item == only_descendants_of
            or function_call_item.is_descendant_of(only_descendants_of)
        ):
            picked_function_call = function_call_item
            break

    if picked_function_call:
        return (
            picked_function_call,
            f"/function_calls/functioncall/{picked_function_call.id}/change",
            None,
        )
    for function_call_item in get_ordered_queryset(
        [
            FunctionCall.Status.READY_FOR_APPROVAL,
            FunctionCall.Status.REQUIRES_HUMAN_INPUT,
        ]
    ):
        if (
            only_descendants_of is None
            or function_call_item == only_descendants_of
            or function_call_item.is_descendant_of(only_descendants_of)
        ):
            picked_function_call = function_call_item
            break
    # debugger("cdnsknk")
    if picked_function_call:
        if picked_function_call.function.name == "create_domain_name_v1":
            # domain_name = DomainName(
            #     name="bluewind.ai", function_call=picked_function_call, user=user
            # )
            return (
                picked_function_call,
                f"/domain_names/domainname/add/?function_call={picked_function_call.id}&name=bluewind.ai",
                None,
            )
        if picked_function_call.function.name == "create_apollo_company_searches_v1":
            # ranges_to_add = EmployeeRange.objects.filter(range__in=["1-10", "11-50"])
            # domain_name = ApolloCompanySearch.objects.create(
            #     function_call=function_call,
            # )
            # domain_name = ApolloCompanySearch(
            #     organization_num_employees_ranges=ranges_to_add,
            #     function_call=function_call,
            # )
            return (
                picked_function_call,
                f"/apollo_company_searches/apollocompanysearch/add/?function_call={picked_function_call.id}&organization_num_employees_ranges=101,200",
                None,
            )
        return (
            picked_function_call,
            f"/function_calls/functioncall/{picked_function_call.id}/change",
            None,
        )

    raise Exception("NO JOB LEFT")
