import importlib

from django.utils import timezone
from workspace_snapshots.models import WorkspaceDiff, WorkspaceSnapshot
from workspaces.models import Workspace


def flow_runner(flow_run):
    # Determine which workspace to use
    if flow_run.create_new_workspace:
        workspace = Workspace.objects.create(
            name=f"Test Workspace {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}"
        )
    else:
        workspace = flow_run.workspace

    # Take snapshot before
    snapshot_before = WorkspaceSnapshot.objects.create(workspace=workspace)

    # Dynamically import and run the flow
    module_path = f"flows.flows.{flow_run.flow.name}"
    flow_module = importlib.import_module(module_path)
    flow_function = getattr(flow_module, flow_run.flow.name)

    # Run the flow function and capture its result
    flow_result = flow_function(workspace)

    # Take snapshot after
    snapshot_after = WorkspaceSnapshot.objects.create(workspace=workspace)

    # Create diff
    diff = WorkspaceDiff.objects.create(
        workspace=workspace,
        snapshot_before=snapshot_before,
        snapshot_after=snapshot_after,
    )

    # Attach diff to flow_run
    flow_run.diff = diff
    flow_run.save(update_fields=["diff"])

    return {
        "status": "completed",
        "diff_id": diff.id,
        "workspace_id": workspace.id,
        "flow_result": flow_result,
    }
