# flow_runs/admin.py
import importlib
import logging

from django.forms import model_to_dict
from django.utils import timezone

from bluewind.context_variables import get_workspace_id
from flow_runs.models import FlowRun

logger = logging.getLogger("django.temp")


def run_flow(flow, user, input_data={}):
    deserialized_data = {}
    for field, value in input_data.items():
        if isinstance(value, list):
            deserialized_data[field] = list(map(model_to_dict, list(value)))
        else:
            deserialized_data[field] = model_to_dict(value)

    flow_run = FlowRun.objects.create(
        user=user,
        workspace_id=get_workspace_id(),
        input_data=deserialized_data,
        output_data="",
        flow=flow,
        status=FlowRun.Status.RUNNING,
        executed_at=timezone.now(),
    )
    try:
        flow_module_name = f"flows.{flow.name}.flows"
        flow_module = importlib.import_module(flow_module_name)
        function_name = flow.name
        function_to_run = getattr(flow_module, function_name)

        result = function_to_run(flow_run, **input_data)
        flow_run.output_data = result
        flow_run.save()

    except Exception as e:
        flow_run.output_data = str(e)
        flow_run.save()

        raise e
    return flow_run
