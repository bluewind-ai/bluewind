import json
import unittest

from django.contrib.auth import get_user_model
from django.utils import timezone
from flows.models import Action, Credentials, Flow, FlowRun, Step, StepRun
from workspace_snapshots.models import (
    DiffRelatedEntities,
    WorkspaceDiff,
    WorkspaceSnapshot,
)
from workspaces.models import Workspace


class FlowStepRunTestCase(unittest.TestCase):
    def test_create_flow_step_run(self):
        # Create a workspace with a timestamp
        workspace_name = (
            f"Test Workspace {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}"
        )
        workspace = Workspace.objects.create(name=workspace_name)

        # Create a credential
        credential = Credentials.objects.create(
            workspace=workspace, key="TEST_CREDENTIAL", value="test_value"
        )

        # Create flow components
        flow, flow_run, action, step = self.create_flow_with_one_step(workspace)

        # Set action_input in the flow_run's state
        flow_run.state["action_input"] = {
            "key": "TEST_ACTION_INPUT",
            "value": "test_action_value",
        }
        flow_run.save(update_fields=["state"])

        # Add debug prints
        print(f"\nFlow steps: {list(flow.steps.all())}")
        print(f"Completed step runs: {list(flow_run.step_runs.all())}")
        print(f"Flow run state: {flow_run.state}")

        # Create a snapshot before creating the step run
        snapshot_before = WorkspaceSnapshot.objects.create(workspace=workspace)

        # Create a step run
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

        # Create DiffRelatedEntities
        related_entities = DiffRelatedEntities.objects.create(
            workspace=workspace, diff=diff
        )

        print("\nWorkspace Diff:")
        print(json.dumps(diff.diff_data, indent=2))

        print("\nDiff Related Entities:")
        print(json.dumps(related_entities.data, indent=2))

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

        # Create a step
        step = Step.objects.create(workspace=workspace, flow=flow, action=action)

        # Create a test user with a unique username
        User = get_user_model()
        unique_username = f"testuser_{timezone.now().timestamp()}"
        user = User.objects.create_user(
            username=unique_username, password="testpassword"
        )

        # Create a flow run
        flow_run = FlowRun.objects.create(
            workspace=workspace,
            flow=flow,
            status=FlowRun.Status.IN_PROGRESS,
            user=user,
            state={},
        )

        return flow, flow_run, action, step
