import importlib

# flows/flows/flow_runner.py


def flow_runner(flow_run):
    if flow_run.create_new_workspace:
        workspace = flow_run.workspace.clone()
    else:
        workspace = flow_run.workspace

    # Collect arguments
    arguments = {}
    for arg in flow_run.arguments.all():
        if arg.contenttype:
            arguments["contenttype"] = arg.contenttype

    if "contenttype" not in arguments:
        raise ValueError("ContentType argument is missing")

    # Import and run the flow function
    module_path = f"flows.{flow_run.flow.name}.flows"

    flow_module = importlib.import_module(module_path)
    flow_function = getattr(flow_module, flow_run.flow.name)
    flow_result = flow_function(workspace, contenttype=arguments["contenttype"])

    return {
        "status": "completed",
        "workspace_id": workspace.id,
        "flow_result": flow_result,
    }
