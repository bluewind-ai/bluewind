import unittest

from django.utils import timezone
from flows.models import Action, Credentials, Flow, FlowRun, StepRun
from workspaces.models import Workspace


class FlowStepRunTestCase(unittest.TestCase):
    def test_create_flow_step_run(self):
        # Create a workspace with a timestamp
        workspace_name = (
            f"Test Workspace {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}"
        )
        workspace = Workspace.objects.create(name=workspace_name)

        # Perform your assertions or additional logic here
        self.assertIsNotNone(workspace.id)  # Check that the Workspace was created
        self.assertEqual(workspace.name, workspace_name)  # Ensure the name matches

        # Create a credential
        credential = Credentials.objects.create(
            workspace=workspace, key="TEST_CREDENTIAL", value="test_value"
        )

        # Create flow components using the renamed method
        flow, flow_run, action = self.create_flow_with_one_step(workspace)

        # Create a step run without specifying the step
        step_run = StepRun.objects.create(
            workspace=workspace, flow_run=flow_run, start_date=timezone.now()
        )

        # Assertions
        self.assertEqual(Credentials.objects.count(), 1)
        self.assertEqual(Flow.objects.count(), 1)
        self.assertEqual(FlowRun.objects.count(), 1)
        self.assertEqual(StepRun.objects.count(), 1)

        self.assertEqual(step_run.flow_run, flow_run)
        self.assertEqual(step_run.workspace, workspace)
        self.assertIsNotNone(step_run.start_date)
        self.assertIsNone(step_run.end_date)

        # Check the credential
        self.assertEqual(Credentials.objects.first().key, "TEST_CREDENTIAL")
        self.assertEqual(Credentials.objects.first().value, "test_value")

        # Complete the step run
        step_run.complete()
        step_run.refresh_from_db()
        self.assertIsNotNone(step_run.end_date)

        # Verify that the step is automatically associated based on the flow_run
        self.assertIsNotNone(step_run.step)
        self.assertEqual(step_run.step.flow, flow)
        self.assertEqual(step_run.step.action, action)

    def create_flow_with_one_step(self, workspace):
        # Get the CREATE action for Credentials
        action = Action.objects.get(
            workspace=workspace,
            action_type=Action.ActionType.CREATE,
            model__name="credentials",
        )

        # Create a flow
        flow = Flow.objects.create(
            workspace=workspace, name="Test Flow", description="A test flow"
        )

        # Create a flow run
        flow_run = FlowRun.objects.create(
            workspace=workspace, flow=flow, status=FlowRun.Status.IN_PROGRESS
        )

        return flow, flow_run, action
