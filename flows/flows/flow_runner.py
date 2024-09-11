import importlib

from workspace_snapshots.models import WorkspaceDiff, WorkspaceSnapshot


def flow_runner(flow_run):
    print("Executing dummy method before the flow")

    # Take snapshot before
    snapshot_before = WorkspaceSnapshot.objects.create(workspace=flow_run.workspace)

    # Dynamically import and run the flow
    module_path = f"flows.flows.{flow_run.flow.name}"
    flow_module = importlib.import_module(module_path)
    flow_function = getattr(flow_module, flow_run.flow.name)

    result = flow_function(flow_run)

    print("Executing dummy method after the flow")

    # Take snapshot after
    snapshot_after = WorkspaceSnapshot.objects.create(workspace=flow_run.workspace)

    # Create diff
    diff = WorkspaceDiff.objects.create(
        workspace=flow_run.workspace,
        snapshot_before=snapshot_before,
        snapshot_after=snapshot_after,
    )

    # Attach diff to flow_run
    flow_run.diff = diff
    flow_run.save(update_fields=["diff"])

    # Ensure the result is serializable
    if callable(result):
        result = str(result)  # Convert function to string representation
    elif not isinstance(result, (dict, list, str, int, float, bool, type(None))):
        result = str(result)  # Convert non-serializable objects to string

    return {"status": "completed", "result": result, "diff_id": diff.id}
