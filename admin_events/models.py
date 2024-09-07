import json
import logging

from django.apps import apps
from django.contrib import admin
from django.contrib.admin import helpers
from django.contrib.admin.views.main import ChangeList
from django.core.serializers.json import DjangoJSONEncoder
from django.db import models
from django.forms.models import modelformset_factory
from django.http import HttpResponse, JsonResponse
from django.template.response import TemplateResponse
from django.utils.decorators import method_decorator
from django.views.decorators.http import require_POST
from workspaces.models import WorkspaceRelated

logger = logging.getLogger(__name__)


class RecordingAdmin(admin.ModelAdmin):
    list_display = ["name", "start_time", "end_time"]
    search_fields = ["name", "description"]

    def change_view(self, request, object_id, form_url="", extra_context=None):
        recording = self.get_object(request, object_id)
        if recording is None:
            return HttpResponse("Recording not found", status=404)
        admin_events = AdminEvent.objects.filter(recording=recording).order_by(
            "timestamp"
        )

        nodes = [
            {
                "id": "recording",
                "type": "input",
                "data": {"label": recording.name},
                "position": {"x": 250, "y": 0},
            }
        ]
        edges = []

        for i, event in enumerate(admin_events):
            node_id = f"event_{i}"
            nodes.append(
                {
                    "id": node_id,
                    "data": {"label": f"{event.action} on {event.model_name}"},
                    "position": {"x": 250, "y": (i + 1) * 100},
                }
            )
            if i == 0:
                edges.append(
                    {
                        "id": f"e-recording-{node_id}",
                        "source": "recording",
                        "target": node_id,
                    }
                )
            else:
                edges.append(
                    {
                        "id": f"e-event_{i-1}-{node_id}",
                        "source": f"event_{i-1}",
                        "target": node_id,
                    }
                )

        admin_events_data = [
            {
                "id": event.id,
                "action": event.action,
                "model_name": event.model_name,
                "timestamp": event.timestamp.isoformat(),
                "user": str(event.user),
                "data": event.data,
            }
            for event in admin_events
        ]

        context = {
            "original": recording,
            "opts": self.model._meta,
            "app_label": self.model._meta.app_label,
            "graph_data": json.dumps({"nodes": nodes, "edges": edges}),
            "admin_events": json.dumps(admin_events_data, cls=DjangoJSONEncoder),
        }

        return TemplateResponse(
            request, "admin/admin_events/recording/recording_change_form.html", context
        )


class Recording(WorkspaceRelated):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.name


class AdminEvent(WorkspaceRelated):
    timestamp = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey("users.User", on_delete=models.CASCADE)
    action = models.CharField(max_length=100)
    model_name = models.CharField(max_length=100)
    object_id = models.IntegerField(null=True, blank=True)
    data = models.JSONField(encoder=DjangoJSONEncoder)
    recording = models.ForeignKey(
        Recording,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="admin_events",
    )

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


class AdminEventAdmin(admin.ModelAdmin):
    list_display = [
        "__str__",
        "data",
        "timestamp",
        "user",
        "action",
        "model_name",
        "object_id",
        "recording",
    ]

    def change_view(self, request, object_id, form_url="", extra_context=None):
        admin_event = self.get_object(request, object_id)
        if admin_event:
            model_class = admin_event.get_model_class()
            if model_class:
                model_admin = self.admin_site._registry.get(model_class)
                if model_admin:
                    if admin_event.action == "list_view":
                        # Handle list view
                        list_display = model_admin.get_list_display(request)
                        list_display_links = model_admin.get_list_display_links(
                            request, list_display
                        )
                        list_filter = model_admin.get_list_filter(request)
                        search_fields = model_admin.get_search_fields(request)

                        sortable_by = model_admin.get_sortable_by(request)
                        search_help_text = model_admin.search_help_text

                        # Create a ChangeList instance
                        cl = ChangeList(
                            request,
                            model_class,
                            list_display,
                            list_display_links,
                            list_filter,
                            model_admin.date_hierarchy,
                            search_fields,
                            model_admin.list_select_related,
                            model_admin.list_per_page,
                            model_admin.list_max_show_all,
                            model_admin.list_editable,
                            model_admin,
                            sortable_by=sortable_by,
                            search_help_text=search_help_text,
                        )

                        # Override the queryset with the stored data
                        cl.queryset = model_class.objects.filter(
                            id__in=[obj["id"] for obj in admin_event.data["output"]]
                        )

                        # Add formset to ChangeList
                        if model_admin.list_editable:
                            FormSet = modelformset_factory(
                                model_class,
                                fields=model_admin.list_editable,
                                extra=0,
                                widgets=model_admin.get_widgets(request),
                            )
                            formset = FormSet(queryset=cl.result_list)
                            cl.formset = formset
                        else:
                            cl.formset = None

                        # Prepare the context
                        context = {
                            "cl": cl,
                            "title": cl.title,
                            "is_popup": cl.is_popup,
                            "to_field": cl.to_field,
                            "media": model_admin.media,
                            "has_add_permission": model_admin.has_add_permission(
                                request
                            ),
                            "opts": cl.opts,
                            "app_label": cl.opts.app_label,
                            "action_form": model_admin.action_form,
                            "actions_on_top": model_admin.actions_on_top,
                            "actions_on_bottom": model_admin.actions_on_bottom,
                            "actions_selection_counter": model_admin.actions_selection_counter,
                            "preserved_filters": model_admin.get_preserved_filters(
                                request
                            ),
                        }

                        return model_admin.changelist_view(request, context)
                    elif admin_event.action in ["create", "update"]:
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
                        inline_instances = model_admin.get_inline_instances(
                            request, obj
                        )
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
                            "has_add_permission": model_admin.has_add_permission(
                                request
                            ),
                            "has_change_permission": model_admin.has_change_permission(
                                request, obj
                            ),
                            "opts": model_class._meta,
                            "app_label": model_class._meta.app_label,
                            "inline_admin_formsets": inline_admin_formsets,
                            "errors": helpers.AdminErrorList(
                                form, inline_admin_formsets
                            ),
                            "preserved_filters": model_admin.get_preserved_filters(
                                request
                            ),
                            "add": add,
                            "change": not add,
                            "has_editable_inline_admin_formsets": False,
                        }

                        return model_admin.render_change_form(
                            request, context, add=add, change=not add, obj=obj
                        )

        return super().change_view(request, object_id, form_url, extra_context)

    @method_decorator(require_POST)
    def detach_from_recording(self, request, queryset):
        import logging

        logger = logging.getLogger(__name__)

        logger.debug(f"Headers: {request.headers}")
        logger.debug(f"POST data: {request.POST}")

        is_ajax = request.headers.get("X-Requested-With") == "XMLHttpRequest"
        logger.debug(f"Is AJAX: {is_ajax}")

        updated = queryset.update(recording=None)
        message = f"{updated} events were successfully detached."

        if is_ajax:
            logger.debug("Returning JSON response")
            return JsonResponse({"status": "success", "message": message})
        else:
            logger.debug("Returning normal response")
            self.message_user(request, message)
            # For non-AJAX requests, let Django handle the response
            return None

    actions = ["detach_from_recording"]
