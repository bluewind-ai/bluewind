import logging

from django.db import models
from django.db.models import F

from domain_names.models import DomainName
from function_calls.models import FunctionCall
from functions.master.v1.functions import master_v1
from users.models import User

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


def snake_to_camel_case_uppercase(snake_str):
    components = snake_str.split("_")
    return "".join(x.capitalize() for x in components)


from django.db.models import Case, Value, When


def go_next_v1():
    def get_ordered_queryset(status):
        return (
            FunctionCall.objects.filter(status=status)
            .annotate(
                parent_created_at=Case(
                    When(parent__isnull=False, then=F("parent__created_at")),
                    default=Value(None),
                    output_field=models.DateTimeField(),
                )
            )
            .order_by(F("parent_created_at").desc(nulls_last=True), "created_at")
        )

    function_call = get_ordered_queryset(
        FunctionCall.Status.COMPLETED_READY_FOR_APPROVAL
    ).first()

    if function_call:
        return (
            function_call.id,
            f"/function_calls/functioncall/{function_call.id}/change",
            None,
        )

    function_call = get_ordered_queryset(FunctionCall.Status.READY_FOR_APPROVAL).first()
    if function_call:
        if function_call.function.name == "create_domain_name_v1":
            domain_name = DomainName(name="bluewind.ai", function_call=function_call)
            return (
                function_call.id,
                f"/domain_names/domainname/add/?function_call={function_call.id}&name=bluewind.ai",
                domain_name,
            )
        if function_call.function.name == "create_apollo_company_searches_v1":
            # ranges_to_add = EmployeeRange.objects.filter(range__in=["1-10", "11-50"])
            # domain_name = ApolloCompanySearch.objects.create(
            #     function_call=function_call,
            # )
            # domain_name = ApolloCompanySearch(
            #     organization_num_employees_ranges=ranges_to_add,
            #     function_call=function_call,
            # )
            return (
                function_call.id,
                f"/apollo_company_searches/apollocompanysearch/add/?function_call={function_call.id}&organization_num_employees_ranges=101,200",
                None,
            )
        return (
            function_call.id,
            f"/function_calls/functioncall/{function_call.id}/change",
            None,
        )
    superuser = User.objects.filter(username="wayne@bluewind.ai").first()
    if not superuser:
        master_v1()
        return go_next_v1()
    raise Exception("NO JOB LEFT")
