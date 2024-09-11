import logging

from credentials.models import Credentials
from django.contrib.contenttypes.models import ContentType
from django.core.serializers.json import DjangoJSONEncoder
from django.db import models, transaction
from django.forms import ValidationError
from django.utils import timezone
from flows.flows.flow_runner import flow_runner
from workspace_snapshots.models import WorkspaceDiff
from workspaces.models import Workspace, WorkspaceRelated

logger = logging.getLogger(__name__)


class Flow(WorkspaceRelated):
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    type = models.CharField(
        max_length=10,
        choices=[("no-code", "No Code"), ("python", "Python")],
        default="no-code",
    )

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
    diff = models.ForeignKey(
        WorkspaceDiff,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="flow_runs",
    )
    create_new_workspace = models.BooleanField(default=False)

    def __str__(self):
        return f"Run of {self.flow.name} at {self.created_at}"

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)

        if is_new and self.flow.type == "python":
            result = flow_runner(self)
            self.state["flow_result"] = result
            self.save(update_fields=["state", "diff"])

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
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    is_recorded = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.content_type.model} {self.get_action_type_display()}"

    class Meta:
        unique_together = ("workspace", "action_type", "content_type")


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
    action_input = models.JSONField(default=dict, blank=True)

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
            self.action_input = self.action_input or {}
            self.action_input["error"] = str(e)
            self.results = {"error": str(e)}
            super().save(update_fields=None)
            logger.error(f"Error in ActionRun {self.id}: {str(e)}")
            raise ValidationError(f"Error in action execution: {str(e)}")

        logger.debug(f"ActionRun {self.id} saved successfully")

    def _execute_action(self):
        self.status = "IN_PROGRESS"
        super().save(update_fields=["status"])

        try:
            action_type = self.action.action_type
            model_class = self.get_model_class()

            if (
                action_type == Action.ActionType.CREATE
                and model_class.__name__ == "Channel"
            ):
                new_instance = model_class(
                    workspace=self.step_run.flow_run.workspace,
                    user=self.user,
                    **self.action_input,
                )

                default_credentials = Credentials.objects.get(
                    workspace=self.step_run.flow_run.workspace,
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
                self.step_run.flow_run.state["created_channel_email"] = (
                    new_instance.email
                )
                self.step_run.flow_run.save(update_fields=["state"])

            self.status = "COMPLETED"
            super().save(update_fields=["status", "results"])

        except ValidationError as e:
            self.status = "ERROR"
            self.action_input["error"] = str(e)
            raise
        except Exception as e:
            self.status = "ERROR"
            self.action_input["error"] = f"Unexpected error: {str(e)}"
            raise ValidationError(f"Error in action execution: {str(e)}")

    def get_model_class(self):
        return self.action.content_type.model_class()


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
        is_new = self._state.adding
        super().save(*args, **kwargs)

        if is_new:
            result = flow_runner(self)
            self.state["flow_result"] = result
            self.save(update_fields=["state"])

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
        from .models import ActionRun  # Import here to avoid circular import

        action_input = self.flow_run.state.get("action_input", {})

        with transaction.atomic():
            self.action_run = ActionRun.objects.create(
                workspace=self.workspace,
                action=self.step.action,
                step_run=self,
                user=self.flow_run.user,
                model_name=self.step.action.content_type.model,
                action_input=action_input,
            )
            self.end_date = timezone.now()
            self.save(update_fields=["action_run", "end_date"])

        self.action_run.save()

        self.flow_run.state["last_action_result"] = self.action_run.results
        self.flow_run.save(update_fields=["state"])

    def __str__(self):
        return f"StepRun for {self.step} (Started: {self.start_date})"
