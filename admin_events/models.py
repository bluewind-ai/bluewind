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
from django.contrib.admin import helpers


class AdminEventAdmin(admin.ModelAdmin):
    list_display = [
        "__str__",
        "data",
        "timestamp",
        "user",
        "action",
        "model_name",
        "object_id",
    ]

    def change_view(self, request, object_id, form_url="", extra_context=None):
        admin_event = self.get_object(request, object_id)
        if admin_event and admin_event.action in ["create", "update"]:
            model_class = admin_event.get_model_class()
            if model_class:
                model_admin = self.admin_site._registry.get(model_class)
                if model_admin:
                    initial_data = admin_event.data.get("input", {})

                    if admin_event.action == "create":
                        ModelForm = model_admin.get_form(request)
                        form = ModelForm(initial=initial_data)
                        obj = None
                        add = True
                    elif admin_event.action == "update" and admin_event.object_id:
                        obj = model_class.objects.get(pk=admin_event.object_id)
                        ModelForm = model_admin.get_form(request, obj)
                        form = ModelForm(initial=initial_data, instance=obj)
                        form.data = form.initial.copy()
                        add = False

                    # Prepare inline formsets
                    inline_instances = model_admin.get_inline_instances(request, obj)
                    inline_admin_formsets = []
                    for inline in inline_instances:
                        InlineFormSet = inline.get_formset(request, obj)
                        inline_admin_formset = helpers.InlineAdminFormSet(
                            inline, form, InlineFormSet, request=request
                        )
                        inline_admin_formsets.append(inline_admin_formset)

                    adminForm = helpers.AdminForm(
                        form,
                        model_admin.get_fieldsets(request, obj),
                        model_admin.get_prepopulated_fields(request, obj),
                        model_admin.get_readonly_fields(request, obj),
                        model_admin=model_admin,
                    )

                    context = {
                        "adminform": adminForm,
                        "form": form,
                        "object_id": object_id,
                        "original": obj,
                        "is_popup": False,
                        "save_as": model_admin.save_as,
                        "has_delete_permission": model_admin.has_delete_permission(
                            request, obj
                        ),
                        "has_add_permission": model_admin.has_add_permission(request),
                        "has_change_permission": model_admin.has_change_permission(
                            request, obj
                        ),
                        "opts": model_class._meta,
                        "app_label": model_class._meta.app_label,
                        "inline_admin_formsets": inline_admin_formsets,
                        "errors": helpers.AdminErrorList(form, inline_admin_formsets),
                        "preserved_filters": model_admin.get_preserved_filters(request),
                        "add": add,
                        "change": not add,
                        "has_editable_inline_admin_formsets": False,
                    }

                    return model_admin.render_change_form(
                        request, context, add=add, change=not add, obj=obj
                    )

        return super().change_view(request, object_id, form_url, extra_context)
