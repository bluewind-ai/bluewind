import logging

from credentials.models import Credentials
from django.apps import apps
from django.contrib import admin

# please import transaction
from django.db import models, transaction
from workspaces.models import Workspace, WorkspaceRelated

logger = logging.getLogger(__name__)


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
    state = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"Run of {self.flow.name} at {self.created_at}"

    def save(self, *args, **kwargs):
        if not self.pk:
            self.state = {
                "channel_name": f"Channel for Flow {self.flow.name}",
                "channel_description": f"Automatically created channel for Flow {self.flow.name}",
            }
        super().save(*args, **kwargs)

    def update_status(self):
        total_actions = self.flow.actions.count()
        completed_actions = self.action_runs.filter(status="COMPLETED").count()
        if completed_actions == 0:
            new_status = self.Status.NOT_STARTED
        elif completed_actions == total_actions:
            new_status = self.Status.COMPLETED
        else:
            new_status = self.Status.IN_PROGRESS

        if self.status != new_status:
            self.status = new_status
            self.save(update_fields=["status"])


class FlowRunAdmin(admin.ModelAdmin):
    list_display = ["id", "flow", "workspace", "created_at", "updated_at", "status"]
    fields = ["flow", "workspace", "status", "created_at", "updated_at"]
    readonly_fields = ["created_at", "updated_at"]


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


class Action(models.Model):
    class ActionType(models.TextChoices):
        CREATE = "CREATE", "Create"
        SAVE = "SAVE", "Save"
        DELETE = "DELETE", "Delete"
        CUSTOM = "CUSTOM", "Custom"
        LIST = "LIST", "List"
        SHOW = "SHOW", "Show"

    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE)
    action_type = models.CharField(max_length=20, choices=ActionType.choices)
    model = models.ForeignKey(Model, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.get_action_type_display()} on {self.model.name}"


class ActionAdmin(admin.ModelAdmin):
    list_display = [
        "action_type",
        "model",
    ]
    list_filter = ["action_type", "model"]
    search_fields = ["model__name"]


admin.site.register(Action, ActionAdmin)


import json
import logging

from django.contrib import admin
from django.contrib.admin.views.main import ChangeList
from django.core.serializers.json import DjangoJSONEncoder

# please import transaction
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
        action_runs = ActionRun.objects.filter(recording=recording).order_by(
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

        for i, event in enumerate(action_runs):
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

        action_runs_data = [
            {
                "id": event.id,
                "action": event.action,
                "model_name": event.model_name,
                "timestamp": event.timestamp.isoformat(),
                "user": str(event.user),
                "data": event.data,
            }
            for event in action_runs
        ]

        context = {
            "original": recording,
            "opts": self.model._meta,
            "app_label": self.model._meta.app_label,
            "graph_data": json.dumps({"nodes": nodes, "edges": edges}),
            "action_runs": json.dumps(action_runs_data, cls=DjangoJSONEncoder),
        }

        return TemplateResponse(
            request, "admin/action_runs/recording/recording_change_form.html", context
        )


class Recording(WorkspaceRelated):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.name


class Step(WorkspaceRelated):
    flow = models.ForeignKey("Flow", on_delete=models.CASCADE, related_name="steps")
    parent_step = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="child_steps",
    )
    action = models.ForeignKey(Action, on_delete=models.CASCADE, related_name="steps")

    def __str__(self):
        return f"Step of {self.flow.name}"


class StepAdmin(admin.ModelAdmin):
    list_display = [
        "flow",
        "parent_step",
        "action",
    ]
    list_filter = ["flow", "action"]
    search_fields = ["flow__name", "action__action_type"]


admin.site.register(Step, StepAdmin)


class ActionRun(WorkspaceRelated):
    flow_run = models.ForeignKey(
        FlowRun, on_delete=models.CASCADE, related_name="action_runs"
    )
    step = models.ForeignKey(
        Step,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="action_runs",
    )

    action = models.ForeignKey(
        Action, on_delete=models.CASCADE, related_name="action_runs"
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey("users.User", on_delete=models.CASCADE)
    model_name = models.CharField(max_length=100)
    object_id = models.IntegerField(null=True, blank=True)
    data = models.JSONField(encoder=DjangoJSONEncoder)
    recording = models.ForeignKey(
        Recording,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="action_runs",
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ("PENDING", "Pending"),
            ("IN_PROGRESS", "In Progress"),
            ("COMPLETED", "Completed"),
            ("ERROR", "Error"),
        ],
        default="PENDING",
    )
    action_input = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.action} on {self.model_name} {self.object_id} by {self.user}"

    def get_model_class(self):
        parts = self.model_name.split(".")
        if len(parts) == 2:
            return apps.get_model(parts[0], parts[1])
        else:
            for app_config in apps.get_app_configs():
                try:
                    return app_config.get_model(self.model_name)
                except LookupError:
                    continue
        return None

    def process_action_run(self):
        try:
            self.status = "IN_PROGRESS"
            self.save(update_fields=["status"])

            self.perform_action()

            self.status = "COMPLETED"
            self.save(update_fields=["status"])
        except Exception as e:
            logger.exception(f"Error processing action run: {str(e)}")
            self.status = "ERROR"
            self.action_input["error"] = str(e)  # Store the error in action_input
            self.save(update_fields=["status", "action_input"])

    def perform_action(self):
        action_type = self.action.action_type
        model_class = self.get_model_class()

        logger.info(
            f"Performing action: {action_type} on model: {model_class.__name__}"
        )

        if (
            action_type == Action.ActionType.CREATE
            and model_class.__name__ == "Channel"
        ):
            default_values = self.action_input.copy()
            default_values["workspace"] = self.flow_run.workspace
            default_values["user"] = self.user

            # Fetch the default Gmail credentials
            default_credentials = Credentials.objects.get(
                workspace=self.flow_run.workspace, key="DEFAULT_GMAIL_CREDENTIALS"
            )
            default_values["gmail_credentials"] = default_credentials

            new_instance = model_class.objects.create(**default_values)

            self.action_input["result"] = {
                "action": "CREATE",
                "model": "Channel",
                "id": new_instance.id,
            }
            self.flow_run.state["created_channel_id"] = new_instance.id
            self.flow_run.state["created_channel_email"] = new_instance.email
            self.flow_run.save(update_fields=["state"])

        # ... (implement other action types as needed)

        logger.info(f"Action result: {self.data}")


class ActionRunAdmin(admin.ModelAdmin):
    list_display = [
        "__str__",
        "data",
        "timestamp",
        "user",
        "action",
        "model_name",
        "object_id",
        "recording",
        "action_input",
        "step",  # Add this line
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
                        initial_data = (
                            admin_event.action_input
                        )  # Use action_input instead of data.get("input", {})

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
