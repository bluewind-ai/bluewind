from django.db import models
from django.utils import timezone

from action_runs.models import ActionRun
from flow_runs.models import FlowRun
from steps.models import Step
from workspaces.models import WorkspaceRelated


class StepRun(WorkspaceRelated):
    step = models.ForeignKey(
        Step,
        on_delete=models.CASCADE,
        related_name="step_runs",
        null=True,
        blank=True,
    )
    action_run = models.OneToOneField(
        ActionRun,
        on_delete=models.CASCADE,
        related_name="associated_step_run",
        null=True,
        blank=True,
    )
    flow_run = models.ForeignKey(
        FlowRun,
        on_delete=models.CASCADE,
        related_name="step_runs",
    )
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(null=True, blank=True)

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
