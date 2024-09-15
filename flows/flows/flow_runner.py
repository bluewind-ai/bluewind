import importlib
import logging

logger = logging.getLogger("django.temp")


# flows/flows/flow_runner.py


def flow_runner(flow_run):
    logger.debug(f"Starting flow_runner for flow_run: {flow_run.id}")

    if flow_run.create_new_workspace:
        workspace = flow_run.workspace.clone()
    else:
        workspace = flow_run.workspace

    logger.debug(f"Workspace: {workspace.id}")

    # Collect arguments
    arguments = {}
    logger.debug("FlowRunArguments for this flow_run:")
    for arg in flow_run.arguments.all():
        logger.debug(
            f"Argument ID: {arg.id}, ContentType: {arg.contenttype}, Object ID: {arg.object_id}"
        )
        if arg.contenttype:
            arguments["contenttype"] = arg.contenttype

    if "contenttype" not in arguments:
        logger.error("ContentType is required for flow function")
        raise ValueError("ContentType argument is missing")

    # Import and run the flow function
    module_path = f"flows.flows.{flow_run.flow.name}"
    logger.debug(f"Importing module: {module_path}")

    flow_module = importlib.import_module(module_path)
    flow_function = getattr(flow_module, flow_run.flow.name)
    logger.debug(f"Flow function: {flow_function}")

    logger.debug(
        f"Calling flow function with arguments: workspace={workspace}, contenttype={arguments['contenttype']}"
    )
    flow_result = flow_function(workspace, contenttype=arguments["contenttype"])

    logger.debug("Flow runner completed successfully")
    return {
        "status": "completed",
        "workspace_id": workspace.id,
        "flow_result": flow_result,
    }
