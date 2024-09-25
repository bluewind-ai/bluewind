# flow_runs/admin.py
import importlib
import json
import logging
from datetime import datetime

from django.core.serializers.json import DjangoJSONEncoder
from django.forms import model_to_dict
from django.utils import timezone

from flow_runs.models import FlowRun

logger = logging.getLogger("django.temp")


def json_serial(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


def run_flow(flow_run, user, input_data={}):
    deserialized_data = {}
    if not flow_run.flow.name == "command_palette_get_commands":
        pass

    for field, value in input_data.items():
        if isinstance(value, list):
            deserialized_data[field] = list(map(model_to_dict, list(value)))
        elif isinstance(value, dict):
            deserialized_data[field] = model_to_dict(value)
        elif isinstance(value, (int, str, bool, float)):
            deserialized_data[field] = value
        elif isinstance(value, object):
            deserialized_data[field] = model_to_dict(value)
        else:
            raise Exception("type not covered", field, value)

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

    # Serialize the result to handle datetime objects
    flow_run.output_data = json.loads(json.dumps(result, default=json_serial))

    if not flow_run.flow.name == "command_palette_get_commands":
        pass

    logger.debug(
        f"Attempting to save FlowRun with input_data: {
            json.dumps(
                flow_run.input_data,
                cls=DjangoJSONEncoder)} and output_data: {
            json.dumps(
                flow_run.output_data,
                cls=DjangoJSONEncoder)}"
    )

    flow_run.save()
    return flow_run
