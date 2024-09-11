import importlib


def flow_runner(flow_run):
    print("Executing dummy method before the flow")

    # Dynamically import and run the flow
    module_path = f"flows.flows.{flow_run.flow.name}"
    flow_module = importlib.import_module(module_path)
    flow_function = getattr(flow_module, flow_run.flow.name)

    result = flow_function(flow_run)

    print("Executing dummy method after the flow")

    # Ensure the result is serializable
    if callable(result):
        result = str(result)  # Convert function to string representation
    elif not isinstance(result, (dict, list, str, int, float, bool, type(None))):
        result = str(result)  # Convert non-serializable objects to string

    return {"status": "completed", "result": result}
