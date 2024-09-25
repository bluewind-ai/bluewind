# flow_runs/admin.py
import importlib
import logging

from django.forms import model_to_dict
from django.utils import timezone

from flow_runs.models import FlowRun
from flows.models import Flow

logger = logging.getLogger("django.temp")


def run_flow(flow_run, user, input_data={}):
    deserialized_data = {}
    for field, value in input_data.items():
        if isinstance(value, list):
            deserialized_data[field] = list(map(model_to_dict, list(value)))
        elif isinstance(value, dict):
            deserialized_data[field] = model_to_dict(value)
        else:
            deserialized_data[field] = value

    flow_run.status = FlowRun.Status.RUNNING
    flow_run.executed_at = timezone.now()
    flow_run.input_data = deserialized_data
    flow_run.output_data = ""

    flow_module_name = f"flows.{flow_run.flow.name}.flows"
    flow_module = importlib.import_module(flow_module_name)
    function_name = flow_run.flow.name
    function_to_run = getattr(flow_module, function_name)
    result = function_to_run(flow_run, **input_data)
    logger.debug(f"Flow {flow_run.flow.name} executed successfully")
    flow_run.output_data = result
    flow_run.flow = Flow.objects.get(name=flow_run.flow.name)
    # if not flow_run.flow_run.flow.name == "command_palette_get_commands":
    #     raise Exception(flow_run.status, flow)
    # raise Exception(model_to_dict(flow_run))
    flow_run.save()
    return flow_run
