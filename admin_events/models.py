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


from django.contrib import admin
from django.shortcuts import render

from .models import AdminEvent


class AdminEventAdmin(admin.ModelAdmin):
    def change_view(self, request, object_id, form_url="", extra_context=None):
        admin_event = self.get_object(request, object_id)
        if admin_event and admin_event.action in ["create", "update"]:
            model_class = admin_event.get_model_class()
            if model_class:
                model_admin = self.admin_site._registry.get(model_class)
                if model_admin:
                    # Get the form class name from the admin event data
                    form_class_name = admin_event.data.get(
                        "form_class", "ConnectGmailForm"
                    )

                    # Get the form class from the model admin
                    form_class = getattr(model_admin, form_class_name, model_admin.form)

                    # Create an instance of the form with the stored data
                    form = form_class(initial=admin_event.data.get("input", {}))

                    # Make the form read-only
                    for field in form.fields.values():
                        field.widget.attrs["readonly"] = True
                        field.widget.attrs["disabled"] = "disabled"

                    # Prepare the context
                    context = {
                        "title": f"{admin_event.action.capitalize()} {model_class._meta.verbose_name}",
                        "form": form,
                        "original": admin_event,
                        "adminform": admin.helpers.AdminForm(
                            form,
                            list(model_admin.get_fieldsets(request)),
                            model_admin.get_prepopulated_fields(request),
                        ),
                        "is_popup": False,
                        "save_as": False,
                        "show_save": False,
                        "show_save_and_continue": False,
                        "show_save_and_add_another": False,
                        "show_delete": False,
                        "app_label": model_class._meta.app_label,
                        "opts": model_class._meta,
                    }

                    # Add admin_site context
                    context.update(self.admin_site.each_context(request))

                    # Render the form
                    return render(request, "admin/change_form.html", context)

        return super().change_view(request, object_id, form_url, extra_context)

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


admin.site.register(AdminEvent, AdminEventAdmin)
