import logging

from django.db import models

from workspaces.models import WorkspaceRelated

logger = logging.getLogger(__name__)


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
        StepRun,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="associated_action_run",
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

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        update_fields = kwargs.get("update_fields")

        try:
            with transaction.atomic():
                if is_new:
                    super().save(*args, **kwargs)
                    self.status = "IN_PROGRESS"
                    self.save(update_fields=["status"])

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
