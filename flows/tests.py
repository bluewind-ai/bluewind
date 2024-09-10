import sys
from pprint import pprint

from django.test import TestCase
from django.utils import timezone
from flows.models import Action, Credentials, Flow, FlowRun, StepRun
from workspaces.models import Workspace


class FlowStepRunTestCase(TestCase):
    def test_create_flow_step_run(self):
        # Create a workspace
        workspace = Workspace.objects.create(name="Test Workspace")

        # Create a credential
        credential = Credentials.objects.create(
            workspace=workspace, key="TEST_CREDENTIAL", value="test_value"
        )

        def dd(*args):
            for arg in args:
                pprint.pprint(arg)
            sys.exit(1)

        # Get the CREATE action for Credentials
        # get all of them instead of just the first one
        # dd(action)
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
