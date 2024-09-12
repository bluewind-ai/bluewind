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


class FlowTestCase(unittest.TestCase):
    def create_workspace_with_credential(self, workspace_name_prefix="Test Workspace"):
        workspace_name = (
            f"{workspace_name_prefix} {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}"
        )
        workspace = Workspace.objects.create(name=workspace_name)
        credential = Credentials.objects.create(
            workspace=workspace, key="TEST_CREDENTIAL", value="test_value"
        )
        return workspace, credential

    def create_flow_with_one_step(self, workspace):
        action = Action.objects.get(
            workspace=workspace,
            action_type=Action.ActionType.CREATE,
            model__name="credentials",
        )
        flow = Flow.objects.create(
            workspace=workspace, name="Test Flow", description="A test flow"
        )
        step = Step.objects.create(workspace=workspace, flow=flow, action=action)
        User = get_user_model()
        unique_username = f"testuser_{timezone.now().timestamp()}"
        user = User.objects.create_user(
            username=unique_username, password="testpassword"
        )
        flow_run = FlowRun.objects.create(
            workspace=workspace,
            flow=flow,
            status=FlowRun.Status.IN_PROGRESS,
            user=user,
            state={},
        )
        return flow, flow_run, action, step

    def test_create_flow_step_run(self):
        workspace, credential = self.create_workspace_with_credential()
        flow, flow_run, action, step = self.create_flow_with_one_step(workspace)
        flow_run.state["action_input"] = {
            "key": "TEST_ACTION_INPUT",
            "value": "test_action_value",
        }
        flow_run.save(update_fields=["state"])

        snapshot_before = WorkspaceSnapshot.objects.create(workspace=workspace)
        StepRun.objects.create(
            workspace=workspace, flow_run=flow_run, start_date=timezone.now()
        )
        snapshot_after = WorkspaceSnapshot.objects.create(workspace=workspace)

        diff = WorkspaceDiff.objects.create(
            workspace=workspace,
            snapshot_before=snapshot_before,
            snapshot_after=snapshot_after,
        )
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

    def test_bare_bone_flow_snapshot(self):
        workspace, credential = self.create_workspace_with_credential(
            "Bare Bone Workspace"
        )
        snapshot_before = WorkspaceSnapshot.objects.create(workspace=workspace)
        flow, flow_run, action, step = self.create_flow_with_one_step(workspace)
        snapshot_after = WorkspaceSnapshot.objects.create(workspace=workspace)
        diff = WorkspaceDiff.objects.create(
            workspace=workspace,
            snapshot_before=snapshot_before,
            snapshot_after=snapshot_after,
        )
        print("\nDIFF:")
        print(json.dumps(diff.diff_data, indent=2))
        print(
            f"\nDiff URL: http://127.0.0.1:8000/workspaces/{workspace.id}/admin/workspace_snapshots/workspacediff/{diff.id}"
        )
