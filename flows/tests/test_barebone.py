import json
import unittest

from django.contrib.auth import get_user_model
from django.utils import timezone
from flows.models import Action, Flow, FlowRun, Step
from workspace_snapshots.models import WorkspaceDiff, WorkspaceSnapshot
from workspaces.models import Workspace


class BareBoneFlowTestCase(unittest.TestCase):
    def create_bare_bone_flow(self, workspace):
        # Get the CREATE action for Credentials
        action = Action.objects.get(
            workspace=workspace,
            action_type=Action.ActionType.CREATE,
            model__name="credentials",
        )

        # Create a flow
        flow = Flow.objects.create(
            workspace=workspace, name="Bare Bone Flow", description="A bare bone flow"
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
            status=FlowRun.Status.NOT_STARTED,
            user=user,
            state={},
        )

        return flow, flow_run, step

    def test_bare_bone_flow_snapshot(self):
        # Create a workspace with a timestamp
        workspace_name = (
            f"Bare Bone Workspace {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}"
        )
        workspace = Workspace.objects.create(name=workspace_name)

        # Take a snapshot before creating the flow
        snapshot_before = WorkspaceSnapshot.objects.create(workspace=workspace)

        # Create a bare bone flow
        flow, flow_run, step = self.create_bare_bone_flow(workspace)

        # Take a snapshot after creating the flow
        snapshot_after = WorkspaceSnapshot.objects.create(workspace=workspace)

        # Create a WorkspaceDiff
        diff = WorkspaceDiff.objects.create(
            workspace=workspace,
            snapshot_before=snapshot_before,
            snapshot_after=snapshot_after,
        )

        # Print the BEFORE snapshot
        print("\nBEFORE Snapshot:")
        print(json.dumps(snapshot_before.data, indent=2))

        # Print the DIFF
        print("\nDIFF:")
        print(json.dumps(diff.diff_data, indent=2))

        print(
            f"\nDiff URL: http://127.0.0.1:8000/workspaces/{workspace.id}/admin/workspace_snapshots/workspacediff/{diff.id}"
        )


if __name__ == "__main__":
    unittest.main()
