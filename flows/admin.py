from django_reverse_admin import ReverseModelAdmin

from base_model_admin.admin import InWorkspace
from django.contrib import admin
from flows.models import FlowRun


class FlowRunAdmin(ReverseModelAdmin, InWorkspace):
    inline_type = "stacked"
    inline_reverse = [
        (
            "diff",
            {},
        ),
    ]


admin.site.register(FlowRun, FlowRunAdmin)
