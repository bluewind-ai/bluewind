import importlib
import json
import logging

logger = logging.getLogger("django.temp")


def flow_runner(flow_run):
    logger.debug(f"Starting flow_runner for flow_run: {flow_run.id}")

    if flow_run.create_new_workspace:
        workspace = flow_run.workspace.clone()
    else:
        workspace = flow_run.workspace

    logger.debug(f"Workspace: {workspace.id}")

    # Log all arguments associated with this flow_run
    arguments = {}
    logger.debug("FlowRunArguments for this flow_run:")
    for arg in flow_run.arguments.all():
        # Log the full details of each FlowRunArgument
        logger.debug(
            f"Argument ID: {arg.id}, Full Data: {json.dumps({'contenttype': str(arg.contenttype), 'object_id': arg.object_id, 'content_object': str(arg.content_object)})}"
        )

        if arg.contenttype:  # Updated to use 'contenttype' after renaming
            arguments["contenttype"] = arg.contenttype
            logger.debug(f"Argument added: contenttype = {arg.contenttype}")

    # Dynamically import and run the flow
    module_path = f"flows.flows.{flow_run.flow.name}"
    logger.debug(f"Importing module: {module_path}")

    try:
        flow_module = importlib.import_module(module_path)
        flow_function = getattr(flow_module, flow_run.flow.name)
        logger.debug(f"Flow function: {flow_function}")
    except Exception as e:
        logger.error(f"Error importing flow module or function: {str(e)}")
        raise

    # Run the flow function with the workspace and collected arguments
    logger.debug(
        f"Calling flow function with arguments: workspace={workspace}, {arguments}"
    )
    try:
        if "contenttype" in arguments:
            # Pass both workspace and contenttype
            flow_result = flow_function(workspace, contenttype=arguments["contenttype"])
        else:
            logger.warning("ContentType not provided for flow function")
            logger.error("Cannot call flow function without contenttype")
            raise ValueError("ContentType argument is missing")
    except TypeError as e:
        logger.error(f"TypeError when calling flow function: {str(e)}")
        logger.error(f"Flow function signature: {flow_function.__code__.co_varnames}")
        raise
    except Exception as e:
        logger.error(f"Error running flow function: {str(e)}")
        raise

    logger.debug("Flow runner completed successfully")
    return {
        "status": "completed",
        "workspace_id": workspace.id,
        "flow_result": flow_result,
    }
