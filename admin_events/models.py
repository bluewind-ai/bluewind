import json
import logging

from django.apps import apps
from django.contrib import admin, messages
from django.contrib.admin import helpers
from django.contrib.admin.views.main import ChangeList
from django.core.serializers.json import DjangoJSONEncoder
from django.db import models
from django.forms.models import modelformset_factory
from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect
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


class Flow(WorkspaceRelated):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class FlowAdmin(admin.ModelAdmin):
    list_display = ["name", "created_at", "updated_at"]
    search_fields = ["name", "description"]


from django.db import models
from workspaces.models import WorkspaceRelated


class FlowRun(WorkspaceRelated):
    class Status(models.TextChoices):
        NOT_STARTED = "NOT_STARTED", "Not Started"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"

    flow = models.ForeignKey("Flow", on_delete=models.CASCADE, related_name="runs")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.NOT_STARTED
    )

    def __str__(self):
        return f"Run of {self.flow.name} at {self.created_at}"

    @property
    def general_info(self):
        step_runs = self.step_runs.all().order_by("id")

        step_runs_info = [
            {
                "id": step_run.id,
                "action_type": step_run.flow_step.get_action_type_display(),
                "model": step_run.flow_step.model.name,
                "is_completed": True,  # Assuming all StepRuns are completed
                "created_at": step_run.created_at.isoformat(),
                # Add any other relevant StepRun fields here
            }
            for step_run in step_runs
        ]

        return {
            "id": self.id,
            "flow_name": self.flow.name,
            "flow_id": self.flow.id,
            "workspace_id": self.workspace_id,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "total_steps": self.flow.steps.count(),
            "completed_steps": step_runs.count(),
            "status": self.get_status_display(),
            "step_runs": step_runs_info,
        }

    def get_status(self):
        total_steps = self.flow.steps.count()
        completed_steps = self.step_runs.count()
        if completed_steps == 0:
            return self.Status.NOT_STARTED
        elif completed_steps == total_steps:
            return self.Status.COMPLETED
        else:
            return self.Status.IN_PROGRESS

    def update_status(self):
        total_steps = self.flow.steps.count()
        completed_steps = self.step_runs.count()
        if completed_steps == 0:
            new_status = self.Status.NOT_STARTED
        elif completed_steps == total_steps:
            new_status = self.Status.COMPLETED
        else:
            new_status = self.Status.IN_PROGRESS

        if self.status != new_status:
            self.status = new_status
            self.save(update_fields=["status"])


from django.contrib import admin
from django.db import models
from django.forms.widgets import Widget
from django.utils.safestring import mark_safe

from .models import FlowRun


class ReadOnlyJSONWidget(Widget):
    def render(self, name, value, attrs=None, renderer=None):
        if value is None:
            value = {}
        return mark_safe(f"<pre>{json.dumps(value, indent=2)}</pre>")


from django.contrib import admin
from django.utils.html import format_html


class FlowRunAdmin(admin.ModelAdmin):
    list_display = ["id", "flow", "workspace", "created_at", "updated_at", "status"]
    fields = [
        "flow",
        "workspace",
        "status",
        "get_general_info",
    ]
    readonly_fields = ["get_general_info"]

    def get_general_info(self, obj):
        info = obj.general_info
        formatted_json = json.dumps(info, indent=2)
        return format_html(
            '<pre style="background-color: #f0f0f0; padding: 10px; border-radius: 5px;">{}</pre>',
            mark_safe(formatted_json),
        )

    get_general_info.short_description = "General Info"

    def has_add_permission(self, request):
        return True

    def has_change_permission(self, request, obj=None):
        return True

    def has_delete_permission(self, request, obj=None):
        return True


class Model(WorkspaceRelated):
    name = models.CharField(max_length=100)
    app_label = models.CharField(max_length=100)
    workspace = models.ForeignKey(
        "workspaces.Workspace", on_delete=models.CASCADE, null=True
    )

    class Meta:
        unique_together = ("app_label", "name")
        ordering = ["app_label", "name"]

    def __str__(self):
        return self.name

    @property
    def full_name(self):
        return f"{self.app_label}.{self.name}"

    @classmethod
    def insert_all_models(cls):
        from workspaces.models import Workspace  # Import here to avoid circular imports

        try:
            with transaction.atomic():
                # Get or create a default workspace
                default_workspace, _ = Workspace.objects.get_or_create(
                    name="Default Workspace"
                )

                models_to_create = []
                for app_config in apps.get_app_configs():
                    for model in app_config.get_models():
                        model_instance = cls(
                            name=model._meta.model_name,
                            app_label=model._meta.app_label,
                            workspace=default_workspace,
                        )
                        models_to_create.append(model_instance)
                        print(f"Preparing to insert: {model_instance.full_name}")

                created = cls.objects.bulk_create(
                    models_to_create, ignore_conflicts=True
                )
                print(f"Successfully inserted {len(created)} models")
                return len(created)
        except Exception as e:
            print(f"Error inserting models: {e}")
            import traceback

            traceback.print_exc()
            return 0


from django.db import models
from workspaces.models import WorkspaceRelated


class FlowStep(WorkspaceRelated):
    class ActionType(models.TextChoices):
        CREATE = "CREATE", "Create"
        SAVE = "SAVE", "Save"
        DELETE = "DELETE", "Delete"
        ACTION = "ACTION", "Action"
        SELECT = "SELECT", "Select"

    flow = models.ForeignKey("Flow", on_delete=models.CASCADE, related_name="steps")
    action_type = models.CharField(
        max_length=10, choices=ActionType.choices, default=ActionType.ACTION
    )
    model = models.ForeignKey("Model", on_delete=models.PROTECT)

    def __str__(self):
        return (
            f"{self.flow.name} - {self.get_action_type_display()} on {self.model.name}"
        )


class FlowStepInline(admin.TabularInline):
    model = FlowStep
    fk_name = "parent"
    extra = 1


class StepRun(WorkspaceRelated):
    flow_run = models.ForeignKey(
        FlowRun, on_delete=models.CASCADE, related_name="step_runs"
    )

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.flow_run.update_status()

    def delete(self, *args, **kwargs):
        flow_run = self.flow_run
        super().delete(*args, **kwargs)
        flow_run.update_status()

    def save_step_run(self, request, queryset):
        for step in queryset:
            # Assuming each step is associated with a flow
            flow = step.flow

            # Fetch all steps for this flow
            all_steps = FlowStep.objects.filter(flow=flow).order_by("id")

            # Log all steps
            logger.info(f"Saving step run for Flow: {flow.name}")
            for s in all_steps:
                logger.info(f"  Step: {s.action_type} on {s.model.name}")

            # Here you would typically create a StepRun object
            # For demonstration, we're just logging and adding a message
            logger.info(f"Created StepRun for Step: {step}")
            messages.success(request, f"Saved step run for Flow Step: {step}")

        return redirect(request.get_full_path())

    def __str__(self):
        return f"Step Run {self.id} of {self.flow_run}"
