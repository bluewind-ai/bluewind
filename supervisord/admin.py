from django.contrib import admin

from base_admin.admin import InWorkspace

from .models import Supervisord


class SupervisordAdmin(InWorkspace):
    list_display = ["__str__", "status", "last_action_time"]
    readonly_fields = ["status", "last_action_time"]

    def get_fields(self, request, obj=None):
        if obj:  # editing an existing object
            return ["workspace", "status", "last_action_time"]
        return ["workspace", "user"]  # Only workspace for new instances

    def get_readonly_fields(self, request, obj=None):
        if obj:  # editing an existing object
            return self.readonly_fields + ["workspace"]
        return []  # No read-only fields when adding

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if not obj:
            form.base_fields.pop("status", None)
            form.base_fields.pop("last_action_time", None)
        return form

    def has_add_permission(self, request):
        return True

    def has_delete_permission(self, request, obj=None):
        return False

    def get_actions(self, request):
        actions = super().get_actions(request)
        if "delete_selected" in actions:
            del actions["delete_selected"]
        return actions

    def save_model(self, request, obj, form, change):
        if not change:  # If this is a new instance
            obj.status = Supervisord.Status.TERMINATED
        super().save_model(request, obj, form, change)

    # Optional: Add custom actions
    actions = ["start_supervisord"]

    @admin.action(description="Start selected Supervisord instances")
    def start_supervisord(self, request, queryset):
        for supervisord in queryset:
            if supervisord.status == Supervisord.Status.TERMINATED:
                supervisord.save()  # This will trigger the start logic in your save method
        self.message_user(request, f"Started {queryset.count()} Supervisord instances")
