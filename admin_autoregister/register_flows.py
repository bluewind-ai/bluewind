import importlib
import os

from django.conf import settings


def load_flows(workspace):
    from flows.models import Flow

    flows_dir = os.path.join(settings.BASE_DIR, "flows", "flows")

    for filename in os.listdir(flows_dir):
        if filename.endswith(".py"):
            flow_name = filename[:-3]  # Remove .py extension
            flow_path = os.path.join(flows_dir, filename)

            # Import the module
            spec = importlib.util.spec_from_file_location(flow_name, flow_path)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)

            # Check if the module has a function with the same name
            if hasattr(module, flow_name):
                # Create the Flow in the database using the original flow_name
                Flow.objects.create(workspace=workspace, name=flow_name)
