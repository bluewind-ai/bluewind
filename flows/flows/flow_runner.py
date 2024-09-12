import importlib

from django.utils import timezone

from workspaces.models import Workspace


def flow_runner(flow_run):
    # Determine which workspace to use
    if flow_run.create_new_workspace:
        workspace = Workspace.objects.create(
            name=f"Flow Workspace {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}"
        )
    else:
        workspace = flow_run.workspace

    # Dynamically import and run the flow
    module_path = f"flows.flows.{flow_run.flow.name}"
    flow_module = importlib.import_module(module_path)
    flow_function = getattr(flow_module, flow_run.flow.name)

    # Run the flow function and capture its result
    flow_result = flow_function(workspace)

    return {
        "status": "completed",
        "workspace_id": workspace.id,
        "flow_result": flow_result,
    }
