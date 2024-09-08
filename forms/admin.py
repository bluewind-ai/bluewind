# Register your models here.
from base_model_admin.admin import InWorkspace
from django.contrib.admin.helpers import AdminForm
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.template.response import TemplateResponse
from django.urls import path, reverse
from django.utils.html import format_html


class FormAdmin(InWorkspace):
    def change_view(self, request, object_id, form_url="", extra_context=None):
        form = self.get_object(request, object_id)
        _, model_admin = form.get_model_and_admin()
        return model_admin.add_view(request)


class WizardAdmin(InWorkspace):
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "<path:object_id>/change/",
                self.admin_site.admin_view(self.redirect_to_run),
                name="forms_wizard_change",
            ),
            path(
                "<path:object_id>/run/",
                self.admin_site.admin_view(self.run_wizard),
                name="forms_wizard_run",
            ),
            path(
                "<path:object_id>/run/<int:step>/",
                self.admin_site.admin_view(self.run_wizard),
                name="forms_wizard_run_step",
            ),
        ]
        return custom_urls + urls

    def redirect_to_run(self, request, object_id):
        return HttpResponseRedirect(reverse("admin:forms_wizard_run", args=[object_id]))

    def run_wizard(self, request, object_id, step=1):
        wizard = get_object_or_404(Wizard, id=object_id)
        steps = wizard.steps.all().order_by("order")

        if not steps:
            self.message_user(request, "This wizard has no steps.", level="warning")
            return HttpResponseRedirect(reverse("admin:forms_wizard_changelist"))

        current_step = steps[step - 1]
        form_model, model_admin = current_step.form.get_model_and_admin()

        if not form_model or not model_admin:
            self.message_user(
                request, "Unable to find the associated model or admin.", level="error"
            )
            return HttpResponseRedirect(reverse("admin:forms_wizard_changelist"))

        ModelForm = model_admin.get_form(request)

        if request.method == "POST":
            form = ModelForm(request.POST)
            if form.is_valid():
                form.save()
                self.message_user(request, f"Step {step} saved successfully.")
                if step < steps.count():
                    return HttpResponseRedirect(
                        reverse(
                            "admin:forms_wizard_run_step", args=[object_id, step + 1]
                        )
                    )
                else:
                    self.message_user(request, "Wizard completed successfully!")
                    return HttpResponseRedirect(
                        reverse("admin:forms_wizard_changelist")
                    )
        else:
            form = ModelForm()

        fieldsets = model_admin.get_fieldsets(request)
        readonly_fields = model_admin.get_readonly_fields(request)
        prepopulated_fields = dict(model_admin.get_prepopulated_fields(request))

        admin_form = AdminForm(
            form,
            fieldsets,
            prepopulated_fields,
            readonly_fields,
            model_admin=model_admin,
        )

        formsets, inline_instances = model_admin._create_formsets(
            request, form.instance, change=False
        )

        context = {
            "title": f"Run Wizard: {wizard.name} - Step {step}",
            "adminform": admin_form,
            "original": None,
            "wizard": wizard,
            "step": current_step,
            "is_popup": False,
            "save_as": False,
            "has_view_permission": model_admin.has_view_permission(request),
            "has_add_permission": model_admin.has_add_permission(request),
            "has_change_permission": model_admin.has_change_permission(request),
            "has_delete_permission": model_admin.has_delete_permission(request),
            "has_editable_inline_admin_formsets": False,
            "opts": form_model._meta,
            "app_label": form_model._meta.app_label,
            "media": model_admin.media + admin_form.media,
            "inline_admin_formsets": [],
            "errors": None,
            "preserved_filters": model_admin.get_preserved_filters(request),
            "add": True,
            "change": False,
            "form_url": "",
            "formsets": formsets,
            "current_step": step,
            "total_steps": steps.count(),
        }
        return TemplateResponse(request, "admin/change_form.html", context)

    def run_wizard_link(self, obj):
        url = reverse("admin:forms_wizard_run", args=[obj.pk])
        return format_html('<a href="{}">Run Wizard</a>', url)

    run_wizard_link.short_description = "Run"

    list_display = ["name", "run_wizard_link"]

    def run_wizard_link(self, obj):
        url = reverse("admin:forms_wizard_run", args=[obj.pk])
        return format_html('<a href="{}">Run Wizard</a>', url)

    run_wizard_link.short_description = "Run"

    list_display = ["name", "run_wizard_link"]
