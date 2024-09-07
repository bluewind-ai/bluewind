# In models.py (or a new file like admin_events.py)

from django.contrib import admin
from django.db import models
from django.template.response import TemplateResponse
from users.models import User
from workspaces.models import WorkspaceRelated


class AdminEvent(WorkspaceRelated):
    timestamp = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=100)
    model_name = models.CharField(max_length=100)
    object_id = models.IntegerField(null=True, blank=True)
    data = models.JSONField()

    def __str__(self):
        return f"{self.action} on {self.model_name} {self.object_id} by {self.user}"


class AdminEventAdmin(admin.ModelAdmin):
    change_form_template = "admin/admin_events/adminevent/change_form.html"

    def change_view(self, request, object_id, form_url="", extra_context=None):
        obj = self.get_object(request, object_id)
        if obj and obj.action == "update":
            # For 'update' action, we'll show a custom form
            context = {
                **self.admin_site.each_context(request),
                "title": f"Change {obj}",
                "object_id": object_id,
                "original": obj,
                "is_popup": False,
                "to_field": None,
                "media": self.media,
                "inline_admin_formsets": [],
                "errors": None,
                "preserved_filters": self.get_preserved_filters(request),
            }

            # Add the form data from the original admin action
            if obj.data and "input" in obj.data:
                context["form_data"] = obj.data["input"]

            return TemplateResponse(request, self.change_form_template, context)

        # For other actions, use the default change_view
        return super().change_view(request, object_id, form_url, extra_context)


admin.site.register(AdminEvent, AdminEventAdmin)
