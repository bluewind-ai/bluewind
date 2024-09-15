from django.core.serializers.json import DjangoJSONEncoder
from django.db import models
from django.forms import ValidationError

from flows.flows.flow_runner import flow_runner
from workspace_snapshots.models import WorkspaceDiff
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
    state = models.JSONField(default=dict, blank=True)
    diff = models.ForeignKey(
        WorkspaceDiff,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="flow_runs",
    )
    create_new_workspace = models.BooleanField(default=False)
    input_data = models.JSONField(default=dict, blank=True, encoder=DjangoJSONEncoder)

    def save(self, *args, **kwargs):
        # Detect if the status has changed
        status_changed = False
        if self.pk:
            old_status = FlowRun.objects.get(pk=self.pk).status
            if old_status != self.status:
                status_changed = True
        else:
            # New instance; status is set to default
            status_changed = True  # To handle initial save

        super().save(*args, **kwargs)

        # If status changed to IN_PROGRESS, run the flow
        try:
            if status_changed and self.status == self.Status.IN_PROGRESS:
                self.run_flow()
        except ValidationError as e:
            # Handle validation errors
            raise e
        except Exception as e:
            # Log unexpected exceptions
            logger.error(f"Unexpected error during flow execution: {e}")
            raise e

    def run_flow(self):
        # Ensure that FlowRunArguments exist
        if not self.arguments.exists():
            raise ValidationError(
                "At least one FlowRunArgument is required to run the flow."
            )

        # Run the flow
        result = flow_runner(self)
        self.state = result
        self.status = self.Status.COMPLETED
        # Save without triggering the flow again
        super(FlowRun, self).save(update_fields=["state", "status"])
