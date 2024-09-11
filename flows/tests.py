import json
import unittest

from django.utils import timezone
from flows.models import Action, Credentials, Flow, FlowRun, StepRun
from workspace_snapshots.models import WorkspaceDiff, WorkspaceSnapshot
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

        # Create a snapshot before creating the step run
        snapshot_before = WorkspaceSnapshot.objects.create(workspace=workspace)

        # Create a step run without specifying the step
        step_run = StepRun.objects.create(
            workspace=workspace, flow_run=flow_run, start_date=timezone.now()
        )

        # Create a snapshot after creating the step run
        snapshot_after = WorkspaceSnapshot.objects.create(workspace=workspace)

        # Create a WorkspaceDiff
        diff = WorkspaceDiff.objects.create(
            workspace=workspace,
            snapshot_before=snapshot_before,
            snapshot_after=snapshot_after,
        )

        print(
            f"http://127.0.0.1:8000/workspaces/{workspace.id}/admin/workspace_snapshots/workspacediff/{diff.id}"
        )
        # Add this at the end of your test_create_flow_step_run method:

        print("\nWorkspace Diff:")
        print(json.dumps(diff.diff_data, indent=2))

        print(
            f"\nDiff URL: http://127.0.0.1:8000/workspaces/{workspace.id}/admin/workspace_snapshots/workspacediff/{diff.id}"
        )

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
