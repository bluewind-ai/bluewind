# flow_runs/admin.py
import importlib

from django.forms import model_to_dict
from django.utils import timezone

from bluewind.context_variables import get_workspace_id
from flow_runs.models import FlowRun


def run_flow(flow, user, input_data={}):
    deserialized_data = {}
    for field, value in input_data.items():
        if isinstance(value, list):
            deserialized_data[field] = list(map(model_to_dict, list(value)))
        else:
            deserialized_data[field] = model_to_dict(value)
    executed_at = timezone.now()
    try:
        flow_module_name = f"flows.{flow.name}.flows"
        flow_module = importlib.import_module(flow_module_name)
        function_name = flow.name
        function_to_run = getattr(flow_module, function_name)
        flow_run = FlowRun.objects.create(
            user=user,
            workspace_id=get_workspace_id(),
            input_data=deserialized_data,
            output_data="",
            flow=flow,
        )
        result = function_to_run(flow_run, **input_data)
    except Exception as e:
        flow_run = FlowRun(
            user=user,
            workspace_id=get_workspace_id(),
            input_data=deserialized_data,
            output_data=str(e),
            executed_at=executed_at,
            flow=flow,
        )
        raise e

    flow_run = FlowRun(
        user=user,
        workspace_id=get_workspace_id(),
        input_data=deserialized_data,
        output_data=result,
        executed_at=executed_at,
        flow=flow,
    )
    flow_run.save()

    return flow_run
