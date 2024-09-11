import logging

from credentials.models import Credentials
from django.apps import apps
from django.core.serializers.json import DjangoJSONEncoder
from django.db import models, transaction
from django.forms import ValidationError
from django.utils import timezone
from workspaces.models import Workspace, WorkspaceRelated

logger = logging.getLogger(__name__)


class Flow(WorkspaceRelated):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


from django.contrib.auth import get_user_model


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
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, null=True)

    def __str__(self):
        return f"Run of {self.flow.name} at {self.created_at}"

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
        unique_together = ("name", "app_label", "workspace")
        ordering = ["app_label", "name"]

    def __str__(self):
        return self.name

    @property
    def full_name(self):
        return f"{self.app_label}.{self.name}"


class Action(WorkspaceRelated):
    class ActionType(models.TextChoices):
        CREATE = "CREATE", "Create"
        SAVE = "SAVE", "Save"
        DELETE = "DELETE", "Delete"
        CUSTOM = "CUSTOM", "Custom"
        LIST = "LIST", "List"
        SHOW = "SHOW", "Show"

    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE)
    action_type = models.CharField(max_length=20, choices=ActionType.choices)
    model = models.ForeignKey("Model", on_delete=models.CASCADE)
    is_recorded = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.model.name} {self.get_action_type_display()}"

    class Meta:
        unique_together = ("workspace", "action_type", "model")


class ActionInput(models.Model):
    action = models.ForeignKey(
        "Action", on_delete=models.CASCADE, related_name="inputs"
    )
    name = models.CharField(max_length=255)
    type = models.CharField(
        max_length=50,
        choices=[
            ("string", "String"),
            ("integer", "Integer"),
            ("float", "Float"),
            ("boolean", "Boolean"),
            ("json", "JSON"),
            # Add more types as needed
        ],
    )
    required = models.BooleanField(default=True)
    default = models.JSONField(null=True, blank=True)
    choices = models.JSONField(null=True, blank=True)  # For enumerated types
    description = models.TextField(blank=True)

    class Meta:
        unique_together = ("action", "name")

    def __str__(self):
        return f"{self.action} - {self.name}"


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


import logging

from django.db import models
from workspaces.models import WorkspaceRelated

logger = logging.getLogger(__name__)


class ActionRun(WorkspaceRelated):
    action = models.ForeignKey(
        Action, on_delete=models.CASCADE, related_name="action_runs"
    )
    step_run = models.OneToOneField(
        "StepRun",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="associated_action_run",
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey("users.User", on_delete=models.CASCADE)
    model_name = models.CharField(max_length=100)
    object_id = models.IntegerField(null=True, blank=True)
    results = models.JSONField(encoder=DjangoJSONEncoder, default=dict, blank=True)
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

    def __str__(self):
        return f"{self.action} by {self.user}"

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        update_fields = kwargs.get("update_fields")

        try:
            with transaction.atomic():
                if is_new:
                    super().save(*args, **kwargs)

                    self.status = "IN_PROGRESS"
                    self.save(update_fields=["status"])

                    if self.step_run:
                        workspace = self.step_run.flow_run.workspace
                    else:
                        workspace = self.workspace

                    self._execute_action(workspace)

                    self.status = "COMPLETED"
                    self.save(update_fields=["status", "results"])

                elif update_fields:
                    type(self).objects.filter(pk=self.pk).update(
                        **{field: getattr(self, field) for field in update_fields}
                    )
                else:
                    super().save(*args, **kwargs)

        except Exception as e:
            self.status = "ERROR"
            self.results = {"error": str(e)}

            super().save(update_fields=None)

            logger.error(f"Error in ActionRun {self.id}: {str(e)}")
            raise ValidationError(f"Error in action execution: {str(e)}")

        logger.debug(f"ActionRun {self.id} saved successfully")

    def _execute_action(self, workspace):
        action_type = self.action.action_type
        model_class = self.get_model_class()

        if (
            action_type == Action.ActionType.CREATE
            and model_class.__name__ == "Channel"
        ):
            action_inputs = self.action.inputs.all()
            input_data = {}
            for input_field in action_inputs:
                if input_field.name in self.step_run.flow_run.state:
                    input_data[input_field.name] = self.step_run.flow_run.state[
                        input_field.name
                    ]
                elif input_field.required:
                    raise ValidationError(
                        f"Required input {input_field.name} is missing"
                    )
                elif input_field.default is not None:
                    input_data[input_field.name] = input_field.default

            new_instance = model_class(
                workspace=workspace,
                user=self.user,
                **input_data,
            )

            default_credentials = Credentials.objects.get(
                workspace=workspace,
                key="DEFAULT_GMAIL_CREDENTIALS",
            )
            new_instance.gmail_credentials = default_credentials

            new_instance.full_clean()
            new_instance.save()

            self.results = {
                "action": "CREATE",
                "model": "Channel",
                "id": new_instance.id,
            }
            self.step_run.flow_run.state["created_channel_id"] = new_instance.id
            self.step_run.flow_run.state["created_channel_email"] = new_instance.email
            self.step_run.flow_run.save(update_fields=["state"])

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


from django.db import models
from workspaces.models import WorkspaceRelated


class StepRun(WorkspaceRelated):
    step = models.ForeignKey(
        "Step",
        on_delete=models.CASCADE,
        related_name="step_runs",
        null=True,
        blank=True,
    )
    action_run = models.OneToOneField(
        "ActionRun",
        on_delete=models.CASCADE,
        related_name="associated_step_run",
        null=True,
        blank=True,
    )
    flow_run = models.ForeignKey(
        "FlowRun",
        on_delete=models.CASCADE,
        related_name="step_runs",
    )
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        is_new = not self.pk

        if is_new:
            with transaction.atomic():
                super().save(*args, **kwargs)
                self.find_and_run_next_step()
        else:
            super().save(*args, **kwargs)

    def find_and_run_next_step(self):
        self.find_next_step()
        if self.step:
            self.run_action()

    def find_next_step(self):
        flow_steps = self.flow_run.flow.steps.all().order_by("id")
        completed_step_ids = set(
            self.flow_run.step_runs.exclude(id=self.id).values_list(
                "step_id", flat=True
            )
        )

        for step in flow_steps:
            if step.id not in completed_step_ids:
                if (
                    step.parent_step_id is None
                    or step.parent_step_id in completed_step_ids
                ):
                    self.step = step
                    self.save(update_fields=["step"])
                    return

    def run_action(self):
        from .models import ActionRun

        with transaction.atomic():
            self.action_run = ActionRun.objects.create(
                workspace=self.workspace,
                action=self.step.action,
                step_run=self,
                user=self.flow_run.user,
                model_name=self.step.action.model.full_name,
            )
            self.end_date = timezone.now()
            self.save(update_fields=["action_run", "end_date"])

        self.action_run.save()

        self.flow_run.state["last_action_result"] = self.action_run.results
        self.flow_run.save(update_fields=["state"])

    def __str__(self):
        return f"StepRun for {self.step} (Started: {self.start_date})"
