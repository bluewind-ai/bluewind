from django.apps import apps
from django.db import models
from workspaces.models import WorkspaceRelated


class AdminEvent(WorkspaceRelated):
    timestamp = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey("users.User", on_delete=models.CASCADE)
    action = models.CharField(max_length=100)
    model_name = models.CharField(max_length=100)
    object_id = models.IntegerField(null=True, blank=True)
    data = models.JSONField()

    def __str__(self):
        return f"{self.action} on {self.model_name} {self.object_id} by {self.user}"

    def get_model_class(self):
        # Split the model_name if it contains a dot
        parts = self.model_name.split(".")
        if len(parts) == 2:
            return apps.get_model(parts[0], parts[1])
        else:
            # If model_name doesn't contain app_label, we need to search for it
            for app_config in apps.get_app_configs():
                try:
                    return app_config.get_model(self.model_name)
                except LookupError:
                    continue
        return None


# In the same file or in admin.py, update the AdminEventAdmin class:

from django.contrib import admin
from django.shortcuts import redirect
from django.urls import reverse


class AdminEventAdmin(admin.ModelAdmin):
    def change_view(self, request, object_id, form_url="", extra_context=None):
        admin_event = self.get_object(request, object_id)
        if admin_event and admin_event.action in ["create", "update"]:
            model_class = admin_event.get_model_class()
            if model_class:
                model_admin = self.admin_site._registry.get(model_class)
                if model_admin:
                    if admin_event.action == "create":
                        return model_admin.add_view(request)
                    elif admin_event.action == "update" and admin_event.object_id:
                        change_url = reverse(
                            f"admin:{model_class._meta.app_label}_{model_class._meta.model_name}_change",
                            args=[admin_event.object_id],
                        )
                        return redirect(change_url)

        return super().change_view(request, object_id, form_url, extra_context)


admin.site.register(AdminEvent, AdminEventAdmin)
