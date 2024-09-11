from django_json_widget.widgets import JSONEditorWidget
from django_reverse_admin import ReverseModelAdmin

from base_model_admin.admin import InWorkspace
from django import forms
from django.contrib import admin
from flows.models import FlowRun
from workspace_snapshots.models import WorkspaceDiff


class WorkspaceDiffForm(forms.ModelForm):
    class Meta:
        model = WorkspaceDiff
        fields = "__all__"
        widgets = {"diff_data": JSONEditorWidget()}


class WorkspaceDiffInline(admin.StackedInline):
    model = WorkspaceDiff
    form = WorkspaceDiffForm
    fk_name = "flow_runs"  # Adjust this if the related_name is different


class FlowRunAdmin(ReverseModelAdmin, InWorkspace):
    inline_type = "stacked"
    inline_reverse = [
        (
            "diff",
            {"form": WorkspaceDiffForm, "admin_class": WorkspaceDiffInline},
        ),
    ]


admin.site.register(FlowRun, FlowRunAdmin)
