from django_reverse_admin import ReverseModelAdmin

from django.contrib import admin
from flows.models import FlowRun


class FlowRunAdmin(ReverseModelAdmin):
    inline_type = "stacked"
    inline_reverse = [
        (
            "diff",
            {},
        ),
    ]


admin.site.register(FlowRun, FlowRunAdmin)
