import logging

from credentials.models import Credentials
from django.apps import apps
from django.core.serializers.json import DjangoJSONEncoder
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
        return f"{self.model.name} on {self.get_action_type_display()}"


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


class ActionRun(WorkspaceRelated):
    flow_run = models.ForeignKey(
        FlowRun, on_delete=models.CASCADE, null=True, blank=True
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
