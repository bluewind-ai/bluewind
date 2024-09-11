import importlib
import logging

from workspace_snapshots.models import WorkspaceDiff, WorkspaceSnapshot

logger = logging.getLogger(__name__)


def flow_runner(flow_run):
    logger.info("Executing dummy method before the flow")

    # Take snapshot before
    snapshot_before = WorkspaceSnapshot.objects.create(workspace=flow_run.workspace)

    # Dynamically import and run the flow
    module_path = f"flows.flows.{flow_run.flow.name}"
    flow_module = importlib.import_module(module_path)
    flow_function = getattr(flow_module, flow_run.flow.name)

    # Run the flow function, passing only the workspace
    flow_function(flow_run.workspace)

    logger.info("Executing dummy method after the flow")

    # Take snapshot after
    snapshot_after = WorkspaceSnapshot.objects.create(workspace=flow_run.workspace)

    # Create diff
    diff = WorkspaceDiff.objects.create(
        workspace=flow_run.workspace,
        snapshot_before=snapshot_before,
        snapshot_after=snapshot_after,
    )

    # Log the diff
    logger.info(f"Workspace Diff: Diff ID: {diff.id}")
    if diff.diff_data:
        for model_name, changes in diff.diff_data.items():
            logger.info(f"Model: {model_name}")
            logger.info(f"Added: {len(changes.get('added', []))} objects")
            logger.info(f"Modified: {len(changes.get('modified', []))} objects")
            logger.info(f"Deleted: {len(changes.get('deleted', []))} objects")
    else:
        logger.info("No changes detected in the diff_data")

    logger.debug(f"Raw diff_data: {diff.diff_data}")

    # Attach diff to flow_run
    flow_run.diff = diff
    flow_run.save(update_fields=["diff"])

    return {"status": "completed", "diff_id": diff.id}
