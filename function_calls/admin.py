from django import forms
from django.contrib import admin

from base_model_admin.admin import InWorkspace
from function_calls.models import FunctionCall


class FunctionCallForm(forms.ModelForm):
    class Meta:
        model = FunctionCall
        fields = [
            "thoughts",
            "status",
            "function",
            "state",
            "user",
            "workspace",
            "input_data",
            "executed_at",
            "parent",
        ]


class FunctionCallAdmin(InWorkspace, admin.ModelAdmin):
    form = FunctionCallForm

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False  # Allow viewing, but saving will be prevented

    def has_delete_permission(self, request, obj=None):
        return False
