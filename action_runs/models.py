import logging

from django.core.serializers.json import DjangoJSONEncoder
from django.db import models
from django.forms import ValidationError

from actions.models import Action
from credentials.models import Credentials
from recordings.models import Recording
from workspaces.models import WorkspaceRelated

logger = logging.getLogger(__name__)

logger = logging.getLogger(__name__)


class ActionRun(WorkspaceRelated):
    action = models.ForeignKey(
        Action, on_delete=models.CASCADE, related_name="action_runs"
    )
    timestamp = models.DateTimeField(auto_now_add=True)
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
