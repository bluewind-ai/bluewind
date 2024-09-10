from django.test import TestCase
from django.utils import timezone

from .models import Action, ActionRun, Flow, FlowRun, Model, Step, StepRun, Workspace


class StepRunTests(TestCase):
    def setUp(self):
        self.workspace = Workspace.objects.create(name="Test Workspace")
        self.flow = Flow.objects.create(name="Test Flow", workspace=self.workspace)
        self.model = Model.objects.create(
            name="Test Model", app_label="app", workspace=self.workspace
        )

        self.action1 = Action.objects.create(
            workspace=self.workspace,
            action_type=Action.ActionType.CREATE,
            model=self.model,
        )
        self.action2 = Action.objects.create(
            workspace=self.workspace,
            action_type=Action.ActionType.SAVE,
            model=self.model,
        )

        self.step1 = Step.objects.create(flow=self.flow, action=self.action1)
        self.step2 = Step.objects.create(
            flow=self.flow, parent_step=self.step1, action=self.action2
        )

        self.flow_run = FlowRun.objects.create(
            flow=self.flow, workspace=self.workspace, status=FlowRun.Status.NOT_STARTED
        )

    def test_find_next_step_and_action_run_creation(self):
        # Create a step run instance
        step_run = StepRun.objects.create(
            flow_run=self.flow_run, start_date=timezone.now()
        )

        # Check that the next step is correctly assigned
        step_run.find_next_step()
        self.assertEqual(step_run.step, self.step1)

        # Save the step_run to trigger action_run creation
        step_run.save()

        # Verify the ActionRun creation
        action_run = ActionRun.objects.get(step_run=step_run)
        self.assertIsNotNone(action_run)
        self.assertEqual(action_run.action, self.step1.action)

        # Simulate completing the step run
        step_run.end_date = timezone.now()
        step_run.save()

        # Verify that the end_date is set
        self.assertIsNotNone(step_run.end_date)
